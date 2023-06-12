import ModelFactory from '../../models';
import { MessageType, modelName as messageModelName } from '../../models/message';
import { modelName as healthRecordModelName } from '../../models/health-record';
import { logError } from '../../middleware/logging';
import { getNow } from '../time';
import { Op } from 'sequelize';

export const createEhrExtract = async (ehrExtract) => {
  const Message = ModelFactory.getByName(messageModelName);
  const HealthRecord = ModelFactory.getByName(healthRecordModelName);
  const { conversationId, messageId, nhsNumber, fragmentMessageIds } = ehrExtract;
  const healthRecord = { conversationId, nhsNumber };
  const message = {
    conversationId,
    messageId,
    type: MessageType.EHR_EXTRACT,
    receivedAt: getNow(),
  };

  const sequelize = ModelFactory.sequelize;
  const t = await sequelize.transaction();

  try {
    await Message.create(message, { transaction: t });
    await HealthRecord.create(healthRecord, { transaction: t });

    for (const fragmentMessageId of fragmentMessageIds) {
      const fragmentMessage = {
        messageId: fragmentMessageId,
        parentId: messageId,
        type: MessageType.FRAGMENT,
        conversationId,
      };
      await Message.create(fragmentMessage, { transaction: t });
    }
  } catch (e) {
    logError('Message could not be stored', e);
    await t.rollback();
    throw e;
  }
  await t.commit();
};

export const updateFragmentAndCreateItsParts = async (
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

    for (const fragmentPartId of remainingPartsIds) {
      const fragmentPartMessage = {
        messageId: fragmentPartId,
        parentId: messageId,
        type: MessageType.FRAGMENT,
        conversationId,
      };

      const fragmentPartExists = !!(await Message.findByPk(fragmentPartId));
      if (fragmentPartExists) {
        await Message.update(
          { parentId: messageId },
          { where: { messageId: fragmentPartId }, transaction: t }
        );
      } else {
        await Message.create(fragmentPartMessage, { transaction: t });
      }
    }
  } catch (e) {
    logError('Message could not be stored', e);
    await t.rollback();
    throw e;
  }
  await t.commit();
};

export const fragmentExists = async (id) => {
  const Message = ModelFactory.getByName(messageModelName);

  try {
    const fragment = await Message.findByPk(id);

    return !!fragment;
  } catch (e) {
    logError('Querying database for fragment message failed', e);
    throw e;
  }
};

export const createFragmentPart = async (id, conversationId) => {
  const Message = ModelFactory.getByName(messageModelName);
  const sequelize = ModelFactory.sequelize;
  const t = await sequelize.transaction();
  const fragment = {
    messageId: id,
    conversationId,
    type: MessageType.FRAGMENT,
    receivedAt: getNow(),
  };

  try {
    await Message.create(fragment, { transaction: t });
  } catch (e) {
    logError('Creating fragment database entry failed', e);
    await t.rollback();
    throw e;
  }

  await t.commit();
};

export const findAllDeletedMessages = async () => {
  const Message = ModelFactory.getByName(messageModelName);

  return Message.findAll({
    where: {
      deletedAt: {
        [Op.not]: null,
      },
    },
  })
    .then((messages) => messages)
    .catch((error) => {
      logError(error);
      throw new Error(error);
    });
};
