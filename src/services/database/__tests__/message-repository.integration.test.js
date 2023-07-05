import { v4 as uuid } from 'uuid';
import {
  updateFragmentAndCreateItsParts,
  createEhrExtract,
  fragmentExists,
  createFragmentPart,
  findAllMessagesByConversationId,
} from '../message-repository';
import ModelFactory from '../../../models';
import { MessageType, modelName as messageModelName } from '../../../models/message';
import { modelName as healthRecordModelName } from '../../../models/health-record';
import { logError } from '../../../middleware/logging';
import { getNow } from '../../time';
import expect from 'expect';
import {
  generateMultipleUUID,
  generateRandomNhsNumber,
  generateRandomUUID,
} from '../../../utilities/integration-test-utilities';

// Mocking
jest.mock('../../../middleware/logging');
jest.mock('../../time');

describe('messageRepository', () => {
  const Message = ModelFactory.getByName(messageModelName);
  const HealthRecord = ModelFactory.getByName(healthRecordModelName);
  const ehrExtractType = MessageType.EHR_EXTRACT;
  const fragmentMessageId = uuid();
  const fragmentMessageIds = [fragmentMessageId];
  const nhsNumber = '1234567890';
  const now = new Date();

  beforeEach(async () => {
    getNow.mockReturnValue(now);
    await HealthRecord.truncate();
    await Message.truncate();
    await ModelFactory.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await ModelFactory.sequelize.close();
  });

  describe('createEhrExtract', () => {
    it('should create message in db', async () => {
      const conversationId = uuid();
      const messageId = uuid();
      const ehrExtract = { messageId, conversationId, nhsNumber, fragmentMessageIds: [] };
      await createEhrExtract(ehrExtract);

      const actualMessage = await Message.findByPk(messageId);
      expect(actualMessage.messageId).toBe(messageId);
      expect(actualMessage.conversationId).toBe(conversationId);
      expect(actualMessage.type).toBe(ehrExtractType);
      expect(actualMessage.receivedAt).toEqual(now);
    });

    it('should create health record in db', async () => {
      const conversationId = uuid();
      const messageId = uuid();
      const ehrExtract = { messageId, conversationId, nhsNumber, fragmentMessageIds: [] };
      await createEhrExtract(ehrExtract);

      const actualHealthRecord = await HealthRecord.findByPk(conversationId);
      expect(actualHealthRecord.nhsNumber).toBe(nhsNumber);
    });

    it('should create fragments message in db when health record has fragments', async () => {
      const conversationId = uuid();
      const messageId = uuid();
      const ehrExtract = { messageId, conversationId, nhsNumber, fragmentMessageIds };
      await createEhrExtract(ehrExtract);

      const fragmentMessage = await Message.findByPk(fragmentMessageId);
      expect(fragmentMessage.conversationId).toBe(conversationId);
      expect(fragmentMessage.type).toBe(MessageType.FRAGMENT);
      expect(fragmentMessage.parentId).toBe(messageId);
      expect(fragmentMessage.receivedAt).toBeNull();
    });

    it('should not save message or health record with wrong type', async () => {
      const conversationId = uuid();
      const messageId = uuid();
      const ehrExtract = {
        messageId: 'not-a-valid-message-id',
        conversationId,
        nhsNumber,
        fragmentMessageIds: [],
      };

      try {
        await createEhrExtract(ehrExtract);
      } catch (err) {
        expect(err).not.toBeNull();
        expect(logError).toHaveBeenCalledWith('Message could not be stored', err);
      }
      const actualMessage = await Message.findByPk(messageId);
      const actualHealthRecord = await HealthRecord.findByPk(conversationId);
      expect(actualMessage).toBeNull();
      expect(actualHealthRecord).toBeNull();
    });

    it('should not save message or health record with wrong nhs number', async () => {
      const conversationId = uuid();
      const messageId = uuid();
      const ehrExtract = {
        messageId,
        conversationId,
        type: ehrExtractType,
        nhsNumber: 'not-valid',
        fragmentMessageIds: [],
      };

      try {
        await createEhrExtract(ehrExtract);
      } catch (err) {
        expect(err).not.toBeNull();
        expect(logError).toHaveBeenCalledWith('Message could not be stored', err);
      }
      const actualMessage = await Message.findByPk(messageId);
      const actualHealthRecord = await HealthRecord.findByPk(conversationId);
      expect(actualMessage).toBeNull();
      expect(actualHealthRecord).toBeNull();
    });
  });

  describe('updateFragmentAndCreateItsParts', () => {
    it('should update receivedAt for a fragment with current date', async () => {
      const conversationId = uuid();
      const ehrMessageId = uuid();
      const fragmentMessageId = uuid();
      await HealthRecord.create({ conversationId, nhsNumber });
      await Message.create({
        conversationId,
        messageId: ehrMessageId,
        type: MessageType.EHR_EXTRACT,
        receivedAt: new Date(),
      });
      await Message.create({
        conversationId,
        messageId: fragmentMessageId,
        type: MessageType.FRAGMENT,
        receivedAt: null,
      });
      await updateFragmentAndCreateItsParts(fragmentMessageId, conversationId, []);
      const fragment = await Message.findByPk(fragmentMessageId);

      expect(fragment.receivedAt).toEqual(now);
    });

    it('should not update receivedAt for a given fragment if database update query throws', async () => {
      const conversationId = uuid();
      try {
        await updateFragmentAndCreateItsParts('not-valid', conversationId, []);
      } catch (err) {
        expect(err).not.toBeNull();
        expect(logError).toHaveBeenCalledWith('Message could not be stored', err);
      }
    });

    it('should create messages for nested fragments', async () => {
      const conversationId = uuid();
      const ehrMessageId = uuid();
      const fragmentMessageId = uuid();
      const nestedFragmentMessageId = uuid();

      await HealthRecord.create({ conversationId, nhsNumber });
      await Message.create({
        conversationId,
        messageId: ehrMessageId,
        type: MessageType.EHR_EXTRACT,
        receivedAt: new Date(),
      });
      await Message.create({
        conversationId,
        messageId: fragmentMessageId,
        type: MessageType.FRAGMENT,
        receivedAt: null,
      });
      await updateFragmentAndCreateItsParts(fragmentMessageId, conversationId, [
        nestedFragmentMessageId,
      ]);
      const nestedFragmentMessage = await Message.findByPk(nestedFragmentMessageId);

      expect(nestedFragmentMessage.receivedAt).toEqual(null);
      expect(nestedFragmentMessage.parentId).toEqual(fragmentMessageId);
      expect(nestedFragmentMessage.conversationId).toEqual(conversationId);
    });

    it('should update parentId for a nested fragment already existing in the DB', async () => {
      const conversationId = uuid();
      const ehrMessageId = uuid();
      const fragmentMessageId = uuid();
      const nestedFragmentMessageId = uuid();

      await HealthRecord.create({ conversationId, nhsNumber });
      await Message.create({
        conversationId,
        messageId: ehrMessageId,
        type: MessageType.EHR_EXTRACT,
        receivedAt: new Date(),
      });
      await Message.create({
        conversationId,
        messageId: fragmentMessageId,
        type: MessageType.FRAGMENT,
        receivedAt: null,
      });
      await Message.create({
        conversationId,
        messageId: nestedFragmentMessageId,
        type: MessageType.FRAGMENT,
        receivedAt: new Date(),
        parentId: null,
      });

      await updateFragmentAndCreateItsParts(fragmentMessageId, conversationId, [
        nestedFragmentMessageId,
      ]);

      const nestedFragmentMessage = await Message.findByPk(nestedFragmentMessageId);

      expect(nestedFragmentMessage.parentId).toEqual(fragmentMessageId);
    });
  });

  describe('fragmentExists', () => {
    it('should return true for a fragment existing in the database', async () => {
      const conversationId = uuid();
      const messageId = uuid();
      await Message.create({
        conversationId,
        messageId: messageId,
        type: MessageType.FRAGMENT,
        receivedAt: null,
      });

      expect(await fragmentExists(messageId)).toBe(true);
    });

    it('should return false for a fragment that does not exist in the database', async () => {
      const messageId = uuid();
      expect(await fragmentExists(messageId)).toBe(false);
    });

    it('should throw if database querying throws', async () => {
      const messageId = 'not-valid';
      try {
        await fragmentExists(messageId);
      } catch (err) {
        expect(err).not.toBeNull();
        expect(logError).toHaveBeenCalledWith('Querying database for fragment message failed', err);
      }
    });
  });

  describe('createFragmentPart', () => {
    it('should create fragment entry in the database', async () => {
      const messageId = uuid();
      const conversationId = uuid();
      await createFragmentPart(messageId, conversationId);

      const fragment = await Message.findByPk(messageId);

      expect(fragment.conversationId).toEqual(conversationId);
      expect(fragment.receivedAt).toEqual(now);
      expect(fragment.type).toEqual(MessageType.FRAGMENT);
      expect(fragment.parentId).toBeNull();
    });

    it('should throw if database creation query throws', async () => {
      const conversationId = uuid();
      const messageId = 'not-valid';
      try {
        await createFragmentPart(messageId, conversationId);
      } catch (err) {
        expect(err).not.toBeNull();
        expect(logError).toHaveBeenCalledWith('Creating fragment database entry failed', err);
      }
    });
  });

  describe('findAllMessagesByConversationId', () => {
    it('should find all messages successfully, given a valid conversation ID', async () => {
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

      const foundMessages = await findAllMessagesByConversationId(conversationId, false);

      // then
      expect(foundMessages.length).toEqual(5 + 1); // 5 fragments + 1 extract
    });

    it('should return null, given an invalid conversation ID', async () => {
      // given
      const conversationId = generateRandomUUID(false);

      // when
      const foundMessages = await findAllMessagesByConversationId(conversationId, false);

      // then
      expect(foundMessages).toEqual([]);
      expect(foundMessages.length).toBe(0);
    });
  });
});
