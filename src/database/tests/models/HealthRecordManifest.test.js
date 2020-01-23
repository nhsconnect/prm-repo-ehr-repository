import ModelFactory from '../../models';

jest.mock('uuid/v4');

const mockReturnManifest = {
  id: 'some-uuid',
  message_id: 'message-id',
  health_record_id: 'some-health-record',
  completed_at: null,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null
};

describe('MessageFragment', () => {
  const sequelize = ModelFactory.sequelize;
  const HealthRecordManifest = ModelFactory.getByName('HealthRecordManifest');

  const messageId = 'message-id';

  beforeEach(
    () =>
      (HealthRecordManifest.findOrCreate = jest.fn().mockImplementation(() =>
        Promise.resolve([
          {
            get: jest.fn().mockReturnValue(mockReturnManifest)
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
    it('should return mock Health Record Manifest when findOrCreate is called', () => {
      return HealthRecordManifest.findOrCreate({}).then(manifests => {
        expect(manifests[0].get().message_id).toBe(messageId);
        return expect(manifests[0].get().id).toBe('some-uuid');
      });
    });

    it('should call findOrCreate with where: message_id', () => {
      return sequelize.transaction().then(t =>
        HealthRecordManifest.findOrCreateOne(messageId, t)
          .then(() => {
            expect(HealthRecordManifest.findOrCreate).toHaveBeenCalledTimes(1);
            return expect(HealthRecordManifest.findOrCreate).toHaveBeenCalledWith({
              where: {
                message_id: messageId
              },
              transaction: t
            });
          })
          .finally(() => t.rollback())
      );
    });
  });
});
