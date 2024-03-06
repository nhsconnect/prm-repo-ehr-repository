import { v4 as uuid } from 'uuid';
import { logError } from '../../../middleware/logging';
import {
  getConversationById,
  getCurrentHealthRecordIdForPatient,
  getHealthRecordStatus,
  updateConversationCompleteness,
} from '../ehr-conversation-repository';
import { ConversationStates, HealthRecordStatus } from '../../../models/enums';
import { createConversationForTest } from '../../../utilities/integration-test-utilities';
import { createCore } from '../ehr-core-repository';
import { EhrTransferTracker } from '../dynamo-ehr-transfer-tracker';
import { markFragmentAsReceivedAndCreateItsParts } from '../ehr-fragment-repository';
import { HealthRecordNotFoundError } from "../../../errors/errors";

jest.mock('../../../middleware/logging');

describe('healthRecordRepository', () => {
  // ========================= COMMON PROPERTIES =========================
  // const HealthRecord = ModelFactory.getByName(healthRecordModelName);
  // const Message = ModelFactory.getByName(messageModelName);
  const db = EhrTransferTracker.getInstance();
  const markFragmentAsReceived = markFragmentAsReceivedAndCreateItsParts;
  const fail = (reason) => {
    throw new Error(reason);
  };
  const tableNameBackup = db.tableName;
  const mimicDynamodbFail = () => {
    db.tableName = 'non-exist-table';
  };
  const undoMimicDynamodbFail = () => {
    db.tableName = tableNameBackup;
  };
  // =====================================================================

  // ========================= SET UP / TEAR DOWN ========================
  beforeEach(async () => {
    // await HealthRecord.truncate();
    // await Message.truncate();
    // await ModelFactory.sequelize.sync({ force: true });
  });

  afterEach(() => {
    undoMimicDynamodbFail();
  });

  afterAll(async () => {
    // await ModelFactory.sequelize.close();
  });
  // =====================================================================

  describe('getHealthRecordStatus', () => {
    it("should return status 'complete' when conversation status is Complete", async () => {
      // given
      const conversationId = uuid();
      const nhsNumber = '1234567890';
      await createConversationForTest(conversationId, nhsNumber, {
        State: ConversationStates.COMPLETE,
      });

      // when
      const status = await getHealthRecordStatus(conversationId);

      // then
      expect(status).toEqual(HealthRecordStatus.COMPLETE);
    });

    it("should return status 'pending' when conversation status is not Complete", async () => {
      // given
      const conversationId = uuid();
      const nhsNumber = '1234567890';
      await createConversationForTest(conversationId, nhsNumber, {
        State: ConversationStates.CONTINUE_REQUEST_SENT,
      });

      // when
      const status = await getHealthRecordStatus(conversationId);

      // then
      expect(status).toEqual(HealthRecordStatus.PENDING);
    });

    it("should return status 'notFound' when health record is not found", async () => {
      // given
      const conversationId = uuid();

      // when
      const status = await getHealthRecordStatus(conversationId);

      // then
      expect(status).toEqual(HealthRecordStatus.NOT_FOUND);
    });

    it('should throw error if there is a problem retrieving health record from database', async () => {
      // given
      const conversationId = uuid();
      mimicDynamodbFail();

      try {
        // when
        await getHealthRecordStatus(conversationId);
        fail('should have throw');
      } catch (err) {
        // then
        expect(err).not.toBeNull();
        expect(logError).toHaveBeenCalledWith(
          'Health Record could not be retrieved from database',
          err
        );
      }
    });
  });

  describe('updateHealthRecordCompleteness', () => {
    it("should set conversation state to 'Complete' for a small health record", async () => {
      // given
      const conversationId = uuid();
      const messageId = uuid();
      const nhsNumber = '1234567890';
      await createConversationForTest(conversationId, nhsNumber, {
        State: ConversationStates.REQUEST_SENT,
      });
      await createCore({ conversationId, messageId, fragmentMessageIds: [] });

      // when
      await updateConversationCompleteness(conversationId);

      // then
      const conversation = await getConversationById(conversationId);

      expect(conversation.State).toBe(ConversationStates.COMPLETE);
    });

    it('should not set State to Complete if there are still messages to be received', async () => {
      // given
      const conversationId = uuid();
      const messageId = uuid();
      const fragmentMessageId = uuid();
      const nhsNumber = '1234567890';

      await createConversationForTest(conversationId, nhsNumber, {
        State: ConversationStates.CONTINUE_REQUEST_SENT,
      });
      await createCore({ conversationId, messageId, fragmentMessageIds: [fragmentMessageId] });

      // when
      await updateConversationCompleteness(conversationId);

      // then
      const conversation = await getConversationById(conversationId);

      expect(conversation.State).toBe(ConversationStates.CONTINUE_REQUEST_SENT);
    });

    it('Should set State to Complete if all fragments are received', async () => {
      // given
      const conversationId = uuid();
      const messageId = uuid();
      const fragmentMessageIds = [uuid(), uuid(), uuid()];
      const nhsNumber = '1234567890';

      await createConversationForTest(conversationId, nhsNumber, {
        State: ConversationStates.CONTINUE_REQUEST_SENT,
      });
      await createCore({ conversationId, messageId, fragmentMessageIds: fragmentMessageIds });
      for (const fragmentId of fragmentMessageIds) {
        await markFragmentAsReceived(fragmentId, conversationId);
      }

      // when
      await updateConversationCompleteness(conversationId);

      // then
      const conversation = await getConversationById(conversationId);

      expect(conversation.State).toBe(ConversationStates.COMPLETE);
    });

    it('should throw an error when database query fails', async () => {
      // given
      const conversationId = 'not-valid';
      mimicDynamodbFail();

      try {
        // when
        await updateConversationCompleteness(conversationId);
        fail('should have throw');
      } catch (err) {
        // then
        expect(err).not.toBeNull();
        expect(logError).toHaveBeenCalledWith('Failed to update health record completeness', err);
      }
    });
  });

  describe('getCurrentHealthRecordIdForPatient', () => {
    it('should return most recent complete health record conversation id', async () => {
      // given
      const nhsNumber = '9876543210';
      const previousHealthRecordConversationId = uuid();
      const incompleteHealthRecordConversationId = uuid();
      const currentHealthRecordConversationId = uuid();

      await createConversationForTest(previousHealthRecordConversationId, nhsNumber, {
        State: ConversationStates.COMPLETE,
      });

      await createConversationForTest(incompleteHealthRecordConversationId, nhsNumber, {
        State: ConversationStates.TIMEOUT,
      });

      await createConversationForTest(currentHealthRecordConversationId, nhsNumber, {
        State: ConversationStates.COMPLETE,
      });

      // when
      const actual = await getCurrentHealthRecordIdForPatient(nhsNumber);

      // then
      expect(actual).toEqual(currentHealthRecordConversationId);
    });

    it('should throw an error if no complete health record is found', async () => {
      // given
      const nhsNumber = '9876543211';
      const incompleteHealthRecordConversationId = uuid();
      await createConversationForTest(incompleteHealthRecordConversationId, nhsNumber, {
        State: ConversationStates.TIMEOUT,
      });

      // when
      await expect(() => getCurrentHealthRecordIdForPatient(nhsNumber))
        // then
        .rejects.toThrowError(HealthRecordNotFoundError);
    });

    it('should throw an error when cannot find any health record', async () => {
      // given
      const nhsNumber = '1111111112';

      // when
      await expect(() => getCurrentHealthRecordIdForPatient(nhsNumber))
        // then
        .rejects.toThrowError(HealthRecordNotFoundError);
    });
  });

  describe.skip('getHealthRecordMessageIds', () => {
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

  describe.skip('healthRecordExists', () => {
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
        fail('should have throw');
      } catch (err) {
        expect(err).not.toBeNull();
        expect(logError).toHaveBeenCalledWith('Querying database for health record failed', err);
      }
    });
  });

  describe.skip('markHealthRecordAsDeletedForPatient', () => {
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
});
