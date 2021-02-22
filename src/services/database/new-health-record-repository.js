import Sequelize from 'sequelize';
import ModelFactory from '../../models';
import { modelName as healthRecordModelName } from '../../models/health-record-new';
import { MessageType, modelName as messageModelName } from '../../models/message';
import { logError } from '../../middleware/logging';
import { getNow } from '../time';

export const HealthRecordStatus = {
  COMPLETE: 'complete',
  PENDING: 'pending',
  NOT_FOUND: 'notFound'
};

Object.freeze(HealthRecordStatus);

export const getHealthRecordStatus = async conversationId => {
  const HealthRecord = ModelFactory.getByName(healthRecordModelName);
  try {
    const healthRecord = await HealthRecord.findByPk(conversationId);
    if (!healthRecord) {
      return HealthRecordStatus.NOT_FOUND;
    }

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

export const updateHealthRecordCompleteness = async conversationId => {
  const HealthRecord = ModelFactory.getByName(healthRecordModelName);
  const Message = ModelFactory.getByName(messageModelName);
  const sequelize = ModelFactory.sequelize;
  const t = await sequelize.transaction();

  try {
    const pendingMessages = await Message.findAll({
      where: {
        conversationId,
        receivedAt: null
      }
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

export const getCurrentHealthRecordIdForPatient = async nhsNumber => {
  const Op = Sequelize.Op;
  const HealthRecord = ModelFactory.getByName(healthRecordModelName);

  const healthRecords = await HealthRecord.findAll({
    where: {
      nhsNumber,
      completedAt: {
        [Op.ne]: null
      }
    },
    order: [['completedAt', 'DESC']]
  });
  const currentHealthRecord = healthRecords[0];

  return currentHealthRecord.conversationId;
};

export const getHealthRecordExtractMessageId = async conversationId => {
  const Message = ModelFactory.getByName(messageModelName);

  const extractMessage = await Message.findOne({
    where: {
      conversationId,
      type: MessageType.EHR_EXTRACT
    }
  });

  return extractMessage.messageId;
};
