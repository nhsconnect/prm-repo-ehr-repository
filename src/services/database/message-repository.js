import { MessageType, modelName as messageModelName } from '../../models/message';
import { modelName as healthRecordModelName } from '../../models/health-record';
import { logError } from '../../middleware/logging';
import ModelFactory from '../../models';
import { getNow } from '../time';

export const createEhrExtract = async (ehrExtract) => {
  /**
   * @deprecated
   * To be replaced by new method `createCore`
   */
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
  /**
   * @deprecated
   * To be replaced by new method `markFragmentAsReceivedAndCreateItsParts`
   */
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
  /**
   * @deprecated
   * To be replaced by new method of the same name at ehr-fragment-repository
   */
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
  /**
   * @deprecated
   * To be replaced by new method `markFragmentAsReceivedAndCreateItsParts`
   */
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
