import { modelName as healthRecordModelName } from '../../models/health-record';
import { NoHealthRecordFoundError, NoMessageFoundError } from '../../errors/errors';
import { modelName as messageModelName } from '../../models/message';
import { logError } from '../../middleware/logging';
import ModelFactory from '../../models';
import { S3Service } from '../storage';
import { Op } from 'sequelize';

const HealthRecord = ModelFactory.getByName(healthRecordModelName);
const Message = ModelFactory.getByName(messageModelName);

export const deleteHealthRecordAndMessages = async (conversationId) => {
  const sequelize = ModelFactory.sequelize;
  const transaction = await sequelize.transaction();
  const s3 = new S3Service(`/${conversationId}/`);

  try {
    const messageResult = await Message.destroy(
      {
        where: {
          conversationId: {
            [Op.eq]: conversationId,
          },
        },
        force: true,
      },
      { transaction }
    );

    const healthRecordResult = await HealthRecord.destroy(
      {
        where: {
          conversationId: {
            [Op.eq]: conversationId,
          },
        },
        force: true,
      },
      { transaction }
    );

    validateDeletionIntegrity(messageResult, healthRecordResult, conversationId);

    await s3.deleteObject();
    await transaction.commit();
  } catch (error) {
    logError(error);
    transaction.rollback();
    throw error;
  }
};

const validateDeletionIntegrity = (messageResult, healthRecordResult, conversationId) => {
  if (messageResult === 0) {
    throw new NoMessageFoundError(`with Conversation ID ${conversationId}.`);
  } else if (healthRecordResult === 0) {
    throw new NoHealthRecordFoundError(`with Conversation ID ${conversationId}.`);
  }
};
