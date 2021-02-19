import ModelFactory from '../../models';
import { modelName as healthRecordModelName } from '../../models/health-record-new';
import { modelName as messageModelName } from '../../models/message';
import { getNow } from '../time';

export const HealthRecordStatus = {
  COMPLETE: 'complete'
};

Object.freeze(HealthRecordStatus);

export const getHealthRecordStatus = async conversationId => {
  const HealthRecord = ModelFactory.getByName(healthRecordModelName);
  const healthRecord = await HealthRecord.findByPk(conversationId);

  if (healthRecord.completedAt) {
    return HealthRecordStatus.COMPLETE;
  }
};

export const updateHealthRecordCompleteness = async conversationId => {
  const HealthRecord = ModelFactory.getByName(healthRecordModelName);
  const Message = ModelFactory.getByName(messageModelName);

  const pendingMessages = await Message.findAll({
    where: {
      conversationId,
      receivedAt: null
    }
  });

  if (pendingMessages.length === 0) {
    await HealthRecord.update({ completedAt: getNow() }, { where: { conversationId } });
  }
};
