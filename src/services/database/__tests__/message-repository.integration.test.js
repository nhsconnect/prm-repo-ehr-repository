import { v4 as uuid } from 'uuid';
import {
  updateAttachmentAndCreateItsParts,
  createEhrExtract,
  attachmentExists,
  createAttachmentPart,
  attachmentAlreadyReceived
} from '../message-repository';
import ModelFactory from '../../../models';
import { MessageType, modelName as messageModelName } from '../../../models/message';
import { modelName as healthRecordModelName } from '../../../models/health-record';
import { logError } from '../../../middleware/logging';
import { getNow } from '../../time';

jest.mock('../../../middleware/logging');
jest.mock('../../time');

describe('messageRepository', () => {
  const Message = ModelFactory.getByName(messageModelName);
  const HealthRecord = ModelFactory.getByName(healthRecordModelName);
  const ehrExtractType = MessageType.EHR_EXTRACT;
  const attachment = uuid();
  const attachmentMessageIds = [attachment];
  const nhsNumber = '1234567890';
  const now = new Date();

  beforeEach(() => {
    getNow.mockReturnValue(now);
  });

  afterAll(async () => {
    await ModelFactory.sequelize.close();
  });

  describe('createEhrExtract', () => {
    it('should create message in db', async () => {
      const conversationId = uuid();
      const messageId = uuid();
      const ehrExtract = { messageId, conversationId, nhsNumber, attachmentMessageIds: [] };
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
      const ehrExtract = { messageId, conversationId, nhsNumber, attachmentMessageIds: [] };
      await createEhrExtract(ehrExtract);

      const actualHealthRecord = await HealthRecord.findByPk(conversationId);
      expect(actualHealthRecord.nhsNumber).toBe(nhsNumber);
    });

    it('should create attachment message in db when health record has attachments', async () => {
      const conversationId = uuid();
      const messageId = uuid();
      const ehrExtract = { messageId, conversationId, nhsNumber, attachmentMessageIds };
      await createEhrExtract(ehrExtract);

      const actualAttachmentMessage = await Message.findByPk(attachment);
      expect(actualAttachmentMessage.conversationId).toBe(conversationId);
      expect(actualAttachmentMessage.type).toBe(MessageType.ATTACHMENT);
      expect(actualAttachmentMessage.parentId).toBe(messageId);
      expect(actualAttachmentMessage.receivedAt).toBeNull();
    });

    it('should not save message or health record with wrong type', async () => {
      const conversationId = uuid();
      const messageId = uuid();
      const ehrExtract = {
        messageId: 'not-a-valid-message-id',
        conversationId,
        nhsNumber,
        attachmentMessageIds: []
      };

      let caughtException = null;
      try {
        await createEhrExtract(ehrExtract);
      } catch (e) {
        caughtException = e;
      }
      expect(caughtException).not.toBeNull();
      expect(logError).toHaveBeenCalled();
      expect(logError.mock.calls[0][0]).toContain('Message could not be stored because');
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
        attachmentMessageIds: []
      };

      let caughtException = null;
      try {
        await createEhrExtract(ehrExtract);
      } catch (e) {
        caughtException = e;
      }
      expect(caughtException).not.toBeNull();
      expect(logError).toHaveBeenCalled();
      expect(logError.mock.calls[0][0]).toContain('Message could not be stored because');
      const actualMessage = await Message.findByPk(messageId);
      const actualHealthRecord = await HealthRecord.findByPk(conversationId);
      expect(actualMessage).toBeNull();
      expect(actualHealthRecord).toBeNull();
    });
  });

  describe('updateAttachmentAndCreateItsParts', () => {
    it('should update receivedAt for an attachment with current date', async () => {
      const conversationId = uuid();
      const ehrMessageId = uuid();
      const attachmentMessageId = uuid();
      await HealthRecord.create({ conversationId, nhsNumber });
      await Message.create({
        conversationId,
        messageId: ehrMessageId,
        type: MessageType.EHR_EXTRACT,
        receivedAt: new Date()
      });
      await Message.create({
        conversationId,
        messageId: attachmentMessageId,
        type: MessageType.ATTACHMENT,
        receivedAt: null
      });
      await updateAttachmentAndCreateItsParts(attachmentMessageId, conversationId, []);
      const attachment = await Message.findByPk(attachmentMessageId);

      expect(attachment.receivedAt).toEqual(now);
    });

    it('should not update receivedAt for a given attachment if database update query throws', async () => {
      let caughtException = null;
      const conversationId = uuid();
      try {
        await updateAttachmentAndCreateItsParts('not-valid', conversationId, []);
      } catch (e) {
        caughtException = e;
      }

      expect(caughtException).not.toBeNull();
      expect(logError).toHaveBeenCalled();
      expect(logError.mock.calls[0][0]).toContain('Message could not be stored because');
    });

    it('should create messages for attachment parts', async () => {
      const conversationId = uuid();
      const ehrMessageId = uuid();
      const attachmentMessageId = uuid();
      const attachmentRemainingPartId = uuid();

      await HealthRecord.create({ conversationId, nhsNumber });
      await Message.create({
        conversationId,
        messageId: ehrMessageId,
        type: MessageType.EHR_EXTRACT,
        receivedAt: new Date()
      });
      await Message.create({
        conversationId,
        messageId: attachmentMessageId,
        type: MessageType.ATTACHMENT,
        receivedAt: null
      });
      await updateAttachmentAndCreateItsParts(attachmentMessageId, conversationId, [
        attachmentRemainingPartId
      ]);
      const attachmentRemainingPart = await Message.findByPk(attachmentRemainingPartId);

      expect(attachmentRemainingPart.receivedAt).toEqual(null);
      expect(attachmentRemainingPart.parentId).toEqual(attachmentMessageId);
      expect(attachmentRemainingPart.conversationId).toEqual(conversationId);
    });

    it('should update parentId for an attachment part already existing in the DB', async () => {
      const conversationId = uuid();
      const ehrMessageId = uuid();
      const attachmentMessageId = uuid();
      const attachmentRemainingPartId = uuid();

      await HealthRecord.create({ conversationId, nhsNumber });
      await Message.create({
        conversationId,
        messageId: ehrMessageId,
        type: MessageType.EHR_EXTRACT,
        receivedAt: new Date()
      });
      await Message.create({
        conversationId,
        messageId: attachmentMessageId,
        type: MessageType.ATTACHMENT,
        receivedAt: null
      });
      await Message.create({
        conversationId,
        messageId: attachmentRemainingPartId,
        type: MessageType.ATTACHMENT,
        receivedAt: new Date(),
        parentId: null
      });

      await updateAttachmentAndCreateItsParts(attachmentMessageId, conversationId, [
        attachmentRemainingPartId
      ]);

      const attachmentRemainingPart = await Message.findByPk(attachmentRemainingPartId);

      expect(attachmentRemainingPart.parentId).toEqual(attachmentMessageId);
    });
  });

  describe('attachmentExists', () => {
    it('should return true for an attachment existing in the database', async () => {
      const conversationId = uuid();
      const messageId = uuid();
      await Message.create({
        conversationId,
        messageId: messageId,
        type: MessageType.ATTACHMENT,
        receivedAt: null
      });

      expect(await attachmentExists(messageId)).toBe(true);
    });

    it('should return false for an attachment that does not exist in the database', async () => {
      const messageId = uuid();
      expect(await attachmentExists(messageId)).toBe(false);
    });

    it('should throw if database querying throws', async () => {
      const messageId = 'not-valid';
      let caughtException = null;
      try {
        await attachmentExists(messageId);
      } catch (e) {
        caughtException = e;
      }

      expect(caughtException).not.toBeNull();
      expect(logError).toHaveBeenCalledWith(
        'Querying database for attachment message failed',
        caughtException
      );
    });
  });

  describe('createAttachmentPart', () => {
    it('should create attachment entry in the database', async () => {
      const messageId = uuid();
      const conversationId = uuid();
      await createAttachmentPart(messageId, conversationId);

      const attachment = await Message.findByPk(messageId);

      expect(attachment.conversationId).toEqual(conversationId);
      expect(attachment.receivedAt).toEqual(now);
      expect(attachment.type).toEqual(MessageType.ATTACHMENT);
      expect(attachment.parentId).toBeNull();
    });

    it('should throw if database creation query throws', async () => {
      const conversationId = uuid();
      const messageId = 'not-valid';
      let caughtException = null;
      try {
        await createAttachmentPart(messageId, conversationId);
      } catch (e) {
        caughtException = e;
      }

      expect(caughtException).not.toBeNull();
      expect(logError).toHaveBeenCalledWith(
        'Creating attachment database entry failed',
        caughtException
      );
    });
  });

  describe('attachmentAlreadyReceived', () => {
    it('should return false if the attachment is not found in the db', async () => {
      const messageId = uuid();
      expect(await attachmentAlreadyReceived(messageId)).toEqual(false);
    });

    it('should return false if the attachment receivedAt property is null', async () => {
      const conversationId = uuid();
      const messageId = uuid();
      await Message.create({
        conversationId,
        messageId: messageId,
        type: MessageType.ATTACHMENT,
        receivedAt: null
      });

      expect(await attachmentAlreadyReceived(messageId)).toEqual(false);
    });

    it('should return false if the attachment receivedAt property is not null', async () => {
      const conversationId = uuid();
      const messageId = uuid();
      await Message.create({
        conversationId,
        messageId: messageId,
        type: MessageType.ATTACHMENT,
        receivedAt: new Date()
      });

      expect(await attachmentAlreadyReceived(messageId)).toEqual(true);
    });
  });
});
