import ModelFactory from '../../models';
import { modelName } from '../../models/message';
import { logError } from '../../middleware/logging';

export const createMessage = async message => {
  const Message = ModelFactory.getByName(modelName);
  const sequelize = ModelFactory.sequelize;
  const t = await sequelize.transaction();

  try {
    await Message.create(message, { transaction: t });
  } catch (e) {
    logError(`Message could not be stored because: ${e.message}`);
    await t.rollback();
    throw e;
  }
  await t.commit();
};
