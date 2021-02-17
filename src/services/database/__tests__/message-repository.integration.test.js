import { v4 as uuid } from 'uuid';
import { createEhrExtract } from '../message-repository';
import ModelFactory from '../../../models';
import { MessageType, modelName as messageModelName } from '../../../models/message';
import { modelName as healthRecordModelName } from '../../../models/health-record-new';
import { logError } from '../../../middleware/logging';

jest.mock('../../../middleware/logging');

describe('messageRepository', () => {
  const Message = ModelFactory.getByName(messageModelName);
  const HealthRecord = ModelFactory.getByName(healthRecordModelName);
  const ehrExtractType = MessageType.EHR_EXTRACT;
  const nhsNumber = '1234567890';

  afterAll(async () => {
    await ModelFactory.sequelize.close();
  });

  it('should create message in db', async () => {
    const conversationId = uuid();
    const messageId = uuid();
    const ehrExtract = { messageId, conversationId, nhsNumber };
    await createEhrExtract(ehrExtract);

    const actualMessage = await Message.findByPk(messageId);
    expect(actualMessage.messageId).toBe(messageId);
    expect(actualMessage.conversationId).toBe(conversationId);
    expect(actualMessage.type).toBe(ehrExtractType);
  });

  it('should create health record in db', async () => {
    const conversationId = uuid();
    const messageId = uuid();
    const ehrExtract = { messageId, conversationId, nhsNumber };
    await createEhrExtract(ehrExtract);

    const actualHealthRecord = await HealthRecord.findByPk(conversationId);
    expect(actualHealthRecord.nhsNumber).toBe(nhsNumber);
  });

  it('should not save message or health record with wrong type', async () => {
    const conversationId = uuid();
    const messageId = uuid();
    const ehrExtract = { messageId: 'not-a-valid-message-id', conversationId, nhsNumber };

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
    const ehrExtract = { messageId, conversationId, type: ehrExtractType, nhsNumber: 'not-valid' };

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
