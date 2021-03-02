import ModelFactory from '../../models';
import { MessageType, modelName as messageModelName } from '../../models/message';
import { modelName as healthRecordModelName } from '../../models/health-record';
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

export const updateAttachmentAndCreateItsParts = async (
  messageId,
  conversationId,
  remainingPartsIds
) => {
  const Message = ModelFactory.getByName(messageModelName);
  const sequelize = ModelFactory.sequelize;
  const t = await sequelize.transaction();
  try {
    await Message.update(
      { receivedAt: getNow() },
      { where: { messageId: messageId }, transaction: t }
    );

    for (const attachmentPartId of remainingPartsIds) {
      const attachmentPartMessage = {
        messageId: attachmentPartId,
        parentId: messageId,
        type: MessageType.ATTACHMENT,
        conversationId
      };

      const attachmentPartExists = !!(await Message.findByPk(attachmentPartId));
      if (attachmentPartExists) {
        await Message.update(
          { parentId: messageId },
          { where: { messageId: attachmentPartId }, transaction: t }
        );
      } else {
        await Message.create(attachmentPartMessage, { transaction: t });
      }
    }
  } catch (e) {
    logError(`Message could not be stored because: ${e.message}`);
    await t.rollback();
    throw e;
  }
  await t.commit();
};

export const attachmentExists = async id => {
  const Message = ModelFactory.getByName(messageModelName);

  try {
    const attachment = await Message.findByPk(id);

    return !!attachment;
  } catch (e) {
    logError('Querying database for attachment message failed', e);
    throw e;
  }
};

export const createAttachmentPart = async (id, conversationId) => {
  const Message = ModelFactory.getByName(messageModelName);
  const sequelize = ModelFactory.sequelize;
  const t = await sequelize.transaction();
  const attachment = {
    messageId: id,
    conversationId,
    type: MessageType.ATTACHMENT,
    receivedAt: getNow()
  };

  try {
    await Message.create(attachment, { transaction: t });
  } catch (e) {
    logError('Creating attachment database entry failed', e);
    await t.rollback();
    throw e;
  }

  await t.commit();
};
