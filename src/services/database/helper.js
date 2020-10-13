import ModelFactory from '../../models';

const sequelize = ModelFactory.sequelize;

export const runWithinTransaction = async dbInteractionLambda => {
  const transaction = await sequelize.transaction();
  try {
    const response = await dbInteractionLambda(transaction);
    transaction.commit();
    return response;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};
