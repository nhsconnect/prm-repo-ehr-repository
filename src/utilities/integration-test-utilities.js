import { v4 as uuidv4 } from 'uuid';
import ModelFactory from '../models';
import { MessageType, modelName as messageModelName } from '../models/message';
import { logError } from '../middleware/logging';
import { getNow } from '../services/time';
import { Op } from 'sequelize';

const Message = ModelFactory.getByName(messageModelName);

export const generateRandomNhsNumber = () => (Math.floor(Math.random() * 9e9) + 1e9).toString();

export const generateRandomUUID = (isUppercase) =>
  isUppercase ? uuidv4().toUpperCase() : uuidv4();

export const generateMultipleUUID = (amount, isUppercase) =>
  Array(amount)
    .fill(undefined)
    .map(() => (isUppercase ? uuidv4().toUpperCase() : uuidv4()));

export const updateAllFragmentMessagesReceivedAtDateTime = async (messageIds) => {
  const sequelize = ModelFactory.sequelize;
  const transaction = await sequelize.transaction();

  try {
    await Message.update(
      {
        receivedAt: getNow(),
      },
      {
        where: {
          messageId: {
            [Op.in]: messageIds,
          },
          type: {
            [Op.eq]: MessageType.FRAGMENT,
          },
        },
        transaction,
      }
    );

    transaction.commit();
  } catch (error) {
    logError(error);
    transaction.rollback();
    throw error;
  }
};
