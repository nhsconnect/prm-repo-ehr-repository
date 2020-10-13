import ModelFactory from '../../models';

const sequelize = ModelFactory.sequelize;
const HealthRecord = ModelFactory.getByName('HealthRecord');

export const retrieveHealthRecord = async conversationId => {
  const transaction = await sequelize.transaction();
  try {
    const healthRecord = await HealthRecord.findByConversationId(conversationId, transaction);
    transaction.commit();
    return healthRecord;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};
