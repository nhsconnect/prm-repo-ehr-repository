import { v4 as uuid } from 'uuid';
import {
  getHealthRecordStatus,
  updateHealthRecordCompleteness,
  HealthRecordStatus,
  getCurrentHealthRecordIdForPatient,
  getHealthRecordMessageIds,
  messageAlreadyReceived,
  markHealthRecordAsDeletedForPatient,
  hardDeleteHealthRecordByConversationId,
  findHealthRecordByConversationId,
  findAllSoftDeletedHealthRecords,
} from '../health-record-repository';
import ModelFactory from '../../../models';
import { modelName as healthRecordModelName } from '../../../models/health-record';
import { MessageType, modelName as messageModelName } from '../../../models/message';
import { logError } from '../../../middleware/logging';
import { createEhrExtract, findAllMessagesByConversationId } from '../message-repository';
import {
  generateMultipleUUID,
  generateRandomNhsNumber,
  generateRandomUUID,
  updateAllFragmentMessagesReceivedAtDateTime,
} from '../../../utilities/integration-test-utilities';

jest.mock('../../../middleware/logging');

describe('healthRecordRepository', () => {
  // ========================= COMMON PROPERTIES =========================
  const HealthRecord = ModelFactory.getByName(healthRecordModelName);
  const Message = ModelFactory.getByName(messageModelName);
  // =====================================================================

  // ========================= SET UP / TEAR DOWN ========================
  beforeEach(async () => {
    await HealthRecord.truncate();
    await Message.truncate();
    await ModelFactory.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await ModelFactory.sequelize.close();
  });
  // =====================================================================

  describe('getHealthRecordStatus', () => {
    it("should return status 'complete' when health record 'completedAt' field is not null", async () => {
      const conversationId = uuid();
      const nhsNumber = '1234567890';

      await HealthRecord.create({ conversationId, nhsNumber, completedAt: new Date() });
      const status = await getHealthRecordStatus(conversationId);

      expect(status).toEqual(HealthRecordStatus.COMPLETE);
    });

    it("should return status 'pending' when health record 'completedAt' field is null", async () => {
      const conversationId = uuid();
      const nhsNumber = '1234567890';

      await HealthRecord.create({ conversationId, nhsNumber, completedAt: null });
      const status = await getHealthRecordStatus(conversationId);

      expect(status).toEqual(HealthRecordStatus.PENDING);
    });

    it("should return status 'notFound' when health record is not found", async () => {
      const conversationId = uuid();
      const status = await getHealthRecordStatus(conversationId);

      expect(status).toEqual(HealthRecordStatus.NOT_FOUND);
    });

    it('should throw error if there is a problem retrieving health record from database', async () => {
      const conversationId = 'not-a-uuid';
      try {
        await getHealthRecordStatus(conversationId);
      } catch (err) {
        expect(err).not.toBeNull();
        expect(logError).toHaveBeenCalledWith(
          'Health Record could not be retrieved from database',
          err
        );
      }
    });
  });

  describe('updateHealthRecordCompleteness', () => {
    it("should set 'completedAt' property for a small health record", async () => {
      const conversationId = uuid();
      const messageId = uuid();
      const nhsNumber = '1234567890';

      await HealthRecord.create({ conversationId, nhsNumber, completedAt: null });
      await Message.create({
        conversationId,
        messageId,
        type: MessageType.EHR_EXTRACT,
        receivedAt: new Date(),
      });

      await updateHealthRecordCompleteness(conversationId);
      const healthRecord = await HealthRecord.findByPk(conversationId);

      expect(healthRecord.completedAt).not.toBeNull();
    });

    it("should not set 'completedAt' property when there are still messages to be received", async () => {
      const conversationId = uuid();
      const messageId = uuid();
      const fragmentMessageId = uuid();
      const nhsNumber = '1234567890';

      await HealthRecord.create({ conversationId, nhsNumber, completedAt: null });
      await Message.create({
        conversationId,
        messageId,
        type: MessageType.EHR_EXTRACT,
        receivedAt: new Date(),
      });
      await Message.create({
        conversationId,
        messageId: fragmentMessageId,
        type: MessageType.FRAGMENT,
        receivedAt: null,
      });

      await updateHealthRecordCompleteness(conversationId);
      const healthRecord = await HealthRecord.findByPk(conversationId);

      expect(healthRecord.completedAt).toBeNull();
    });

    it('should throw an error when database query fails', async () => {
      const conversationId = 'not-valid';
      try {
        await updateHealthRecordCompleteness(conversationId);
      } catch (err) {
        expect(err).not.toBeNull();
        expect(logError).toHaveBeenCalledWith('Failed to update health record completeness', err);
      }
    });
  });

  describe('getCurrentHealthRecordIdForPatient', () => {
    it('should return most recent complete health record conversation id', async () => {
      const nhsNumber = '9876543210';
      const previousHealthRecordConversationId = uuid();
      const incompleteHealthRecordConversationId = uuid();
      const currentHealthRecordConversationId = uuid();

      await HealthRecord.create({
        conversationId: previousHealthRecordConversationId,
        nhsNumber,
        completedAt: new Date(),
      });
      await HealthRecord.create({
        conversationId: incompleteHealthRecordConversationId,
        nhsNumber,
        completedAt: null,
      });
      await HealthRecord.create({
        conversationId: currentHealthRecordConversationId,
        nhsNumber,
        completedAt: new Date(),
      });

      const currentHealthRecordId = await getCurrentHealthRecordIdForPatient(nhsNumber);

      expect(currentHealthRecordId).toEqual(currentHealthRecordConversationId);
    });

    it('should return undefined if no complete health record is found', async () => {
      const nhsNumber = '9876543211';
      const incompleteHealthRecordConversationId = uuid();

      await HealthRecord.create({
        conversationId: incompleteHealthRecordConversationId,
        nhsNumber,
        completedAt: null,
      });

      const currentHealthRecordId = await getCurrentHealthRecordIdForPatient(nhsNumber);

      expect(currentHealthRecordId).toBeUndefined();
    });

    it('should return undefined when cannot find any health record', async () => {
      const nhsNumber = '1111111112';
      const currentHealthRecordId = await getCurrentHealthRecordIdForPatient(nhsNumber);

      expect(currentHealthRecordId).toBeUndefined();
    });
  });

  describe('getHealthRecordMessageIds', () => {
    it('should throw a meaningful error if there are no undeleted messages associated with conversation id', async () => {
      const conversationId = uuid();
      await Message.create({
        messageId: uuid(),
        conversationId,
        type: MessageType.EHR_EXTRACT,
        receivedAt: new Date(),
        deletedAt: new Date(), // nb magical sequelize "paranoid" deletion
      });

      try {
        await getHealthRecordMessageIds(conversationId);
        fail('should have thrown');
      } catch (e) {
        expect(e.message).toEqual(
          'There were no undeleted messages associated with conversation id'
        );
      }
    });

    it('should return health record extract message id given a conversation id for a small health record', async () => {
      const messageId = uuid();
      const conversationId = uuid();

      await Message.create({
        messageId,
        conversationId,
        type: MessageType.EHR_EXTRACT,
        receivedAt: new Date(),
      });
      const { coreMessageId, fragmentMessageIds } = await getHealthRecordMessageIds(conversationId);

      expect(coreMessageId).toEqual(messageId);
      expect(fragmentMessageIds).toEqual([]);
    });

    it('should return health record extract message id and fragment message ids given singular fragment', async () => {
      const messageId = uuid();
      const conversationId = uuid();
      const fragmentMessageId = uuid();

      await Message.create({
        messageId,
        conversationId,
        type: MessageType.EHR_EXTRACT,
        receivedAt: new Date(),
      });

      await Message.create({
        messageId: fragmentMessageId,
        conversationId,
        type: MessageType.FRAGMENT,
        receivedAt: new Date(),
        parentId: messageId,
      });
      const { coreMessageId, fragmentMessageIds } = await getHealthRecordMessageIds(conversationId);

      expect(coreMessageId).toEqual(messageId);
      expect(fragmentMessageIds).toEqual([fragmentMessageId]);
    });

    it('should return health record extract message id and fragment message ids given nested fragments', async () => {
      const messageId = uuid();
      const conversationId = uuid();
      const fragmentMessageId = uuid();
      const nestedFragmentId = uuid();

      await Message.create({
        messageId,
        conversationId,
        type: MessageType.EHR_EXTRACT,
        receivedAt: new Date(),
      });

      await Message.create({
        messageId: fragmentMessageId,
        conversationId,
        type: MessageType.FRAGMENT,
        receivedAt: new Date(),
        parentId: messageId,
      });

      await Message.create({
        messageId: nestedFragmentId,
        conversationId,
        type: MessageType.FRAGMENT,
        receivedAt: new Date(),
        parentId: fragmentMessageId,
      });

      const { coreMessageId, fragmentMessageIds } = await getHealthRecordMessageIds(conversationId);

      expect(coreMessageId).toEqual(messageId);
      expect(fragmentMessageIds).toEqual([fragmentMessageId, nestedFragmentId]);
    });
  });

  describe('healthRecordExists', () => {
    it("should return false if 'messageId' is not found in db", async () => {
      const messageId = uuid();
      const result = await messageAlreadyReceived(messageId);
      expect(result).toEqual(false);
    });

    it("should return true if 'messageId' is found in db", async () => {
      const conversationId = uuid();
      const messageId = uuid();
      const nhsNumber = '9876543211';

      await HealthRecord.create({
        conversationId,
        nhsNumber,
      });

      await Message.create({
        messageId,
        conversationId,
        type: MessageType.EHR_EXTRACT,
        receivedAt: new Date(),
      });

      const result = await messageAlreadyReceived(messageId);
      expect(result).toEqual(true);
    });

    it('should throw if database querying throws', async () => {
      const messageId = 'not-valid';
      try {
        await messageAlreadyReceived(messageId);
      } catch (err) {
        expect(err).not.toBeNull();
        expect(logError).toHaveBeenCalledWith('Querying database for health record failed', err);
      }
    });
  });

  describe('markHealthRecordAsDeletedForPatient', () => {
    async function createHealthRecordAndMessage(nhsNumber, conversationId, messageId) {
      await HealthRecord.create({
        conversationId,
        nhsNumber,
        completedAt: new Date(),
      });
      await Message.create({
        conversationId,
        messageId,
        type: MessageType.EHR_EXTRACT,
        receivedAt: new Date(),
      });
    }

    it('should return conversation id for the patient marked as deleted', async () => {
      const nhsNumber = '9898989898';
      const messageId = uuid();
      const conversationId = uuid();

      await createHealthRecordAndMessage(nhsNumber, conversationId, messageId);

      const result = await markHealthRecordAsDeletedForPatient(nhsNumber);

      const healthRecordMarkedAsDeleted = await HealthRecord.findAll({
        where: { nhsNumber },
        paranoid: false,
      });

      const messagesMarkedAsDeleted = await Message.findAll({
        where: { conversationId },
        paranoid: false,
      });

      const healthRecordStatusAfterwards = await getHealthRecordStatus(conversationId);

      expect(result).toEqual([conversationId]);
      expect(healthRecordStatusAfterwards).toEqual(HealthRecordStatus.NOT_FOUND);
      expect(healthRecordMarkedAsDeleted[0].deletedAt).not.toBeNull();
      expect(messagesMarkedAsDeleted[0].deletedAt).not.toBeNull();
    });

    it('should return conversation id for the patient marked as deleted when the patient has several health records', async () => {
      const nhsNumber = '6767676767';
      const firstMessageId = uuid();
      const secondMessageId = uuid();
      const firstConversationId = uuid();
      const secondConversationId = uuid();

      await createHealthRecordAndMessage(nhsNumber, firstConversationId, firstMessageId);
      await createHealthRecordAndMessage(nhsNumber, secondConversationId, secondMessageId);

      const result = await markHealthRecordAsDeletedForPatient(nhsNumber);

      const healthRecordMarkedAsDeleted = await HealthRecord.findAll({
        where: { nhsNumber },
        paranoid: false,
      });

      const messagesMarkedAsDeleted = await Message.findAll({
        where: { conversationId: [firstConversationId, secondConversationId] },
        paranoid: false,
      });

      expect(result).toEqual([firstConversationId, secondConversationId]);
      expect(healthRecordMarkedAsDeleted).not.toHaveProperty('deletedAt', null);
      expect(messagesMarkedAsDeleted).not.toHaveProperty('deletedAt', null);
    });
  });

  describe('findAllSoftDeletedHealthRecords', () => {
    it('should find all soft deleted health records for a small EHR successfully', async () => {
      // given
      const [messageId, conversationId] = generateMultipleUUID(2, false);
      const nhsNumber = generateRandomNhsNumber();

      // when
      await createEhrExtract({
        conversationId,
        messageId,
        nhsNumber,
        fragmentMessageIds: [],
      });

      await updateHealthRecordCompleteness(conversationId);
      await markHealthRecordAsDeletedForPatient(nhsNumber);

      const foundRecords = await findAllSoftDeletedHealthRecords();

      // then
      expect(foundRecords.length).toEqual(1);
      expect(foundRecords[0].conversationId).toEqual(conversationId.toLowerCase());
      expect(foundRecords[0].nhsNumber).toEqual(nhsNumber);
    });

    it('should find all soft deleted health records for a large EHR successfully', async () => {
      // given
      const [messageId, conversationId] = generateMultipleUUID(2, false);
      const fragmentMessageIds = generateMultipleUUID(5, false);
      const nhsNumber = generateRandomNhsNumber();

      // when
      await createEhrExtract({
        conversationId,
        messageId,
        nhsNumber,
        fragmentMessageIds,
      });

      await updateAllFragmentMessagesReceivedAtDateTime(fragmentMessageIds);
      await updateHealthRecordCompleteness(conversationId);
      await markHealthRecordAsDeletedForPatient(nhsNumber);

      const foundRecords = await findAllSoftDeletedHealthRecords();
      const foundMessages = await findAllMessagesByConversationId(conversationId, true);

      // then
      expect(foundRecords.length).toEqual(1);
      expect(foundRecords[0].conversationId).toEqual(conversationId);
      expect(foundRecords[0].nhsNumber).toEqual(nhsNumber);
      expect(JSON.stringify(foundMessages).includes('"deletedAt": null')).toEqual(false);
    });

    it('should return empty array if no soft deleted health records are found', async () => {
      // given
      const [messageId, conversationId] = generateMultipleUUID(2, true);
      const nhsNumber = generateRandomNhsNumber();

      // when
      await createEhrExtract({
        conversationId,
        messageId,
        nhsNumber,
        fragmentMessageIds: [],
      });

      const foundRecords = await findAllSoftDeletedHealthRecords();

      // then
      expect(foundRecords).toEqual([]);
    });
  });

  describe('hardDeleteHealthRecordByConversationId', () => {
    it('should hard delete a health record successfully, given a valid conversation id', async () => {
      // given
      const [messageId, conversationId] = generateMultipleUUID(2, false);
      const fragmentMessageIds = generateMultipleUUID(5, false);
      const nhsNumber = generateRandomNhsNumber();

      // when
      await createEhrExtract({
        conversationId,
        messageId,
        nhsNumber,
        fragmentMessageIds,
      });

      await hardDeleteHealthRecordByConversationId(conversationId);

      const foundRecord = await findHealthRecordByConversationId(conversationId);
      const foundSoftDeletedRecords = await findAllSoftDeletedHealthRecords();

      // then
      expect(foundRecord).toBeNull();
      expect(foundSoftDeletedRecords).toEqual([]);
    });

    it('should throw an error, given an invalid conversation id', async () => {
      // given
      const conversationId = generateRandomUUID(true);

      // when
      try {
        await hardDeleteHealthRecordByConversationId(conversationId);
      } catch (error) {
        // then
        expect(error).not.toBeNull();
      }
    });
  });

  describe('findHealthRecordByConversationId', () => {
    it('should return the health record successfully', async () => {
      // given
      const [messageId, conversationId] = generateMultipleUUID(2, false);
      const fragmentMessageIds = generateMultipleUUID(5, false);
      const nhsNumber = generateRandomNhsNumber();

      // when
      await createEhrExtract({
        conversationId,
        messageId,
        nhsNumber,
        fragmentMessageIds,
      });

      const foundRecord = await findHealthRecordByConversationId(conversationId);

      // then
      expect(foundRecord.conversationId).toEqual(conversationId);
      expect(foundRecord.nhsNumber).toEqual(nhsNumber);
    });

    it('should return null if the health record does not exist', async () => {
      // given
      const conversationId = generateRandomUUID(true);

      // when
      const foundRecord = await findHealthRecordByConversationId(conversationId);

      // then
      expect(foundRecord).toBeNull();
    });
  });
});
