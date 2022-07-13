import Sequelize from 'sequelize';
import ModelFactory from '../../models';
import { modelName as healthRecordModelName } from '../../models/health-record';
import { MessageType, modelName as messageModelName } from '../../models/message';
import { logError, logInfo } from '../../middleware/logging';
import { getNow } from '../time';

export const HealthRecordStatus = {
  COMPLETE: 'complete',
  PENDING: 'pending',
  NOT_FOUND: 'notFound',
};

Object.freeze(HealthRecordStatus);

export const getHealthRecordStatus = async (conversationId) => {
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
};

export const markHealthRecordAsDeletedForPatient = async (nhsNumber) => {
  const HealthRecord = ModelFactory.getByName(healthRecordModelName);
  // const Message = ModelFactory.getByName(messageModelName);
  const sequelize = ModelFactory.sequelize;
  const t = await sequelize.transaction();

  try {
    //TODO: pick N conversation Ids?
    const conversationId = await getCurrentHealthRecordIdForPatient(nhsNumber);
    if (!conversationId) {
      await t.rollback();
      return undefined;
    }

    await HealthRecord.update(
      { completedAt: getNow(), deletedAt: getNow() },
      { where: { nhsNumber }, transaction: t }
    );

    // const messages = await Message.findAll({
    //   where: {
    //     conversationId,
    //     receivedAt: null,
    //   },
    // });
    // if (messages.length === 0) {
    //   await Message.update(
    //       { completedAt: getNow() },
    //       { deletedAt: getNow() },
    //       { where: { conversationId }, transaction: t }
    //   );
    // }
    await t.commit();
    return conversationId;
  } catch (err) {
    logError('Failed to mark health record as deleted', err);
    await t.rollback();
    throw err;
  }
};

export const getHealthRecordMessageIds = async (conversationId) => {
  const Message = ModelFactory.getByName(messageModelName);

  const messages = await Message.findAll({
    where: {
      conversationId,
    },
  });

  const healthRecordExtractIndex = messages.findIndex(
    (message) => message.type === MessageType.EHR_EXTRACT
  );
  const healthRecordExtractId = messages[healthRecordExtractIndex].messageId;

  messages.splice(healthRecordExtractIndex, 1);
  const attachmentIds = messages.map((message) => message.messageId);

  return { healthRecordExtractId, attachmentIds };
};

export const healthRecordExists = async (conversationId) => {
  const HealthRecord = ModelFactory.getByName(healthRecordModelName);
  try {
    const healthRecord = await HealthRecord.findByPk(conversationId);

    return !!healthRecord;
  } catch (e) {
    logError('Querying database for health record failed', e);
    throw e;
  }
};
