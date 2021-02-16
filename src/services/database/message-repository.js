import ModelFactory from '../../models';
import { modelName } from '../../models/message';

export const createMessage = async message => {
  const Message = ModelFactory.getByName(modelName);
  const sequelize = ModelFactory.sequelize;
  const t = await sequelize.transaction();

  await Message.create(message, { transaction: t });
  await t.commit();
};
