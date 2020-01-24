import ModelFactory from '../../index';

jest.mock('uuid/v4');

const mockReturnHealthRecord = {
  id: 'some-uuid',
  conversation_id: 'conversation-id',
  patient_id: null,
  completed_at: null,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null
};

describe('HealthRecord', () => {
  const sequelize = ModelFactory.sequelize;
  const HealthRecord = ModelFactory.getByName('HealthRecord');

  const conversationId = 'conversation-id';

  beforeEach(
    () =>
      (HealthRecord.findOrCreate = jest.fn().mockImplementation(() =>
        Promise.resolve([
          {
            get: jest.fn().mockReturnValue(mockReturnHealthRecord)
          }
        ])
      ))
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    sequelize.close();
  });

  describe('findOrCreateOne', () => {
    it('should return mock HealthRecord when findOrCreate is called', () => {
      return HealthRecord.findOrCreate({}).then(healthRecords => {
        expect(healthRecords[0].get().conversation_id).toBe(conversationId);
        return expect(healthRecords[0].get().id).toBe('some-uuid');
      });
    });

    it('should call findOrCreate with where: conversation_id', () => {
      return sequelize.transaction().then(t =>
        HealthRecord.findOrCreateOne(conversationId, t)
          .then(() => {
            expect(HealthRecord.findOrCreate).toHaveBeenCalledTimes(1);
            return expect(HealthRecord.findOrCreate).toHaveBeenCalledWith({
              where: {
                conversation_id: conversationId
              },
              transaction: t
            });
          })
          .finally(() => t.rollback())
      );
    });
  });
});
