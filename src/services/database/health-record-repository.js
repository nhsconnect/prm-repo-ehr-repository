import { MessageType, modelName as messageModelName } from "../../models/message";
import { modelName as healthRecordModelName } from "../../models/health-record";
import { logError, logInfo } from "../../middleware/logging";
import Sequelize from "sequelize";
import ModelFactory from "../../models";
import { getNow } from "../time";
import { HealthRecordStatus } from "../../models/enums";
import { markRecordAsSoftDeleteForPatient } from "./ehr-conversation-repository";

Object.freeze(HealthRecordStatus);

export const getHealthRecordStatus = async (conversationId) => {
  /**
   * @deprecated
   * Replaced by new method `getConversationStatus`
   * To be deleted PRMT-4568
   */
  const HealthRecord = ModelFactory.getByName(healthRecordModelName);
  try {
    const healthRecord = await HealthRecord.findByPk(conversationId);
    if (!healthRecord) {
      logInfo('Health Record not found');
      return HealthRecordStatus.NOT_FOUND;
    }

    logInfo('Health Record retrieved from the database');

    if (healthRecord.completedAt) {
      return HealthRecordStatus.COMPLETE;
    } else {
      return HealthRecordStatus.PENDING;
    }
  } catch (err) {
    logError('Health Record could not be retrieved from database', err);
    throw err;
  }
};

export const updateHealthRecordCompleteness = async (conversationId) => {
  /**
   * @deprecated
   * Replaced by new method `updateConversationCompleteness`
   * To be deleted PRMT-4568
   */
  const HealthRecord = ModelFactory.getByName(healthRecordModelName);
  const Message = ModelFactory.getByName(messageModelName);
  const sequelize = ModelFactory.sequelize;
  const t = await sequelize.transaction();

  try {
    const pendingMessages = await Message.findAll({
      where: {
        conversationId,
        receivedAt: null,
      },
    });
    if (pendingMessages.length === 0) {
      await HealthRecord.update(
        { completedAt: getNow() },
        { where: { conversationId }, transaction: t }
      );
    }
  } catch (err) {
    logError('Failed to update health record completeness', err);
    await t.rollback();
    throw err;
  }

  await t.commit();
};

export const getCurrentHealthRecordIdForPatient = async (nhsNumber) => {
  /**
   * @deprecated
   * Replaced by new method `getCurrentConversationIdForPatient`
   * To be deleted PRMT-4568
   */
  try {
    const Op = Sequelize.Op;
    const HealthRecord = ModelFactory.getByName(healthRecordModelName);

    const healthRecords = await HealthRecord.findAll({
      where: {
        nhsNumber,
        completedAt: {
          [Op.ne]: null,
        },
      },
      order: [['completedAt', 'DESC']],
    });

    if (!healthRecords.length) {
      return undefined;
    }

    const currentHealthRecord = healthRecords[0];

    return currentHealthRecord.conversationId;
  } catch (e) {
    let error = { message: 'Error retrieving health record from database', error: e.message };
    logError(error);
    throw error;
  }
};

export const markHealthRecordAsDeletedForPatient = async (nhsNumber) => {
  /**
   * @deprecated
   * Replaced by new method `markRecordAsSoftDeleteForPatient`
   * To be deleted PRMT-4568
   */
  const HealthRecord = ModelFactory.getByName(healthRecordModelName);
  const Message = ModelFactory.getByName(messageModelName);
  const sequelize = ModelFactory.sequelize;
  const Op = Sequelize.Op;
  const t = await sequelize.transaction();

  const healthRecords = await HealthRecord.findAll({
    where: {
      nhsNumber,
      completedAt: {
        [Op.ne]: null,
      },
    },
    transaction: t,
  })
    .then((healthRecords) => healthRecords)
    .catch((error) => {
      logError(error);
      throw error;
    });

  if (!healthRecords || healthRecords.length === 0) {
    await t.rollback();
    return [];
  }

  await HealthRecord.update({ deletedAt: getNow() }, { where: { nhsNumber }, transaction: t });

  for (const hr of healthRecords) {
    await Message.update(
      { deletedAt: getNow() },
      { where: { conversationId: hr.conversationId }, transaction: t }
    );
  }

  await t.commit();
  return healthRecords.map((hr) => hr.conversationId);
};

export const getHealthRecordMessageIds = async (conversationId) => {
  /**
   * @deprecated
   * Replaced by new method `getMessageIdsForConversation`
   * To be deleted PRMT-4568
   */
  const Message = ModelFactory.getByName(messageModelName);

  logInfo('finding messages for conversation id ' + conversationId);
  const messages = await Message.findAll({
    where: {
      conversationId,
    },
  });

  if (messages.length === 0) {
    throw new Error('There were no undeleted messages associated with conversation id');
  }

  logInfo('finding which message by index is the core in ' + messages.length + ' messages');
  const healthRecordExtractIndex = messages.findIndex(
    (message) => message.type === MessageType.EHR_EXTRACT
  );
  logInfo('core message index is ' + healthRecordExtractIndex);
  const coreMessageId = messages[healthRecordExtractIndex].messageId;

  messages.splice(healthRecordExtractIndex, 1);
  const fragmentMessageIds = messages.map((message) => message.messageId);

  return { coreMessageId, fragmentMessageIds };
};

export const messageAlreadyReceived = async (messageId) => {
  /**
   * @deprecated
   * Replaced by new method `fragmentAlreadyReceived`
   * To be deleted PRMT-4568
   */
  const Message = ModelFactory.getByName(messageModelName);
  try {
    const message = await Message.findByPk(messageId);

    if (!message) {
      return false;
    }
    return message.receivedAt !== null;
  } catch (e) {
    logError('Querying database for health record failed', e);
    throw e;
  }
};
