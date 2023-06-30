import ModelFactory from '../../models';
import { modelName as healthRecordModelName } from '../../models/health-record';
import { modelName as messageModelName } from '../../models/message';
import { Op } from 'sequelize';
import { logError } from '../../middleware/logging';
import { S3Service } from '../storage';

const HealthRecord = ModelFactory.getByName(healthRecordModelName);
const Message = ModelFactory.getByName(messageModelName);

export const deleteHealthRecordAndMessages = async (conversationId) => {
  const sequelize = ModelFactory.sequelize;
  const transaction = await sequelize.transaction();
  const s3 = new S3Service(`/${conversationId}/`);

  try {
    await Message.destroy(
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

    await HealthRecord.destroy(
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

    await s3.deleteObject();
    await transaction.commit();
  } catch (error) {
    logError(error);
    transaction.rollback();
    throw error;
  }
};
