import ModelFactory from '../../../models';

jest.mock('../../../middleware/logging');

describe('retrieveHealthRecord', () => {
  const sequelize = ModelFactory.sequelize;

  const HealthRecord = ModelFactory.getByName('HealthRecord');

  const conversationId = '3244a7bb-555e-433b-b2cc-1aa8178da99e';

  afterAll(() => sequelize.close());

  it('should retrieve health record by conversation id', () => {
    return sequelize.transaction().then(t =>
      HealthRecord.findByConversationId(conversationId, t)
        .then(healthRecord => {
          expect(healthRecord).not.toBeNull();
          return expect(healthRecord.get().conversation_id).toBe(conversationId);
        })
        .finally(() => t.rollback())
    );
  });
});
