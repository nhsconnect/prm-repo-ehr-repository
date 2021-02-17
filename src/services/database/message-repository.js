import ModelFactory from '../../models';
import { MessageType, modelName as messageModelName } from '../../models/message';
import { modelName as healthRecordModelName } from '../../models/health-record-new';
import { logError } from '../../middleware/logging';
import { getNow } from '../time';

export const createEhrExtract = async ehrExtract => {
  const Message = ModelFactory.getByName(messageModelName);
  const HealthRecord = ModelFactory.getByName(healthRecordModelName);
  const { conversationId, messageId, nhsNumber, attachmentMessageIds } = ehrExtract;
  const healthRecord = { conversationId, nhsNumber };
  const message = {
    conversationId,
    messageId,
    type: MessageType.EHR_EXTRACT,
    receivedAt: getNow()
  };

  const sequelize = ModelFactory.sequelize;
  const t = await sequelize.transaction();

  try {
    await Message.create(message, { transaction: t });
    await HealthRecord.create(healthRecord, { transaction: t });

    for (const attachment of attachmentMessageIds) {
      const attachmentMessage = {
        messageId: attachment,
        parentId: messageId,
        type: MessageType.ATTACHMENT,
        conversationId
      };
      await Message.create(attachmentMessage, { transaction: t });
    }
  } catch (e) {
    logError(`Message could not be stored because: ${e.message}`);
    await t.rollback();
    throw e;
  }
  await t.commit();
};
