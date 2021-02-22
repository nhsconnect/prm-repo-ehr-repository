import ModelFactory from '../../models';
import { modelName as healthRecordModelName } from '../../models/health-record-new';
import { modelName as messageModelName } from '../../models/message';
import { getNow } from '../time';
import { logError } from '../../middleware/logging';

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
