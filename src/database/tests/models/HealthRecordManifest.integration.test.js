import ModelFactory from '../../models';

describe('HealthRecordManifest integration', () => {
  const sequelize = ModelFactory.sequelize;
  const HealthRecordManifest = ModelFactory.getByName('HealthRecordManifest');

  const testUUID = 'f72b6225-1cac-43d7-85dd-a0b5b4211cd9';

  const expectedUUID = 'f0a906ef-49b6-49a8-89f1-cb063d31c4dc';
  const expectedMessageId = '93b699fc-03fb-438f-b5a1-ce936e0f9d4e';
  const expectedHealthRecordId = '99ba0ba1-ed1a-4fc1-ab5b-9d79af71aef4';

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    sequelize.close();
  });

  describe('findOrCreateOne', () => {
    it('should reject with error if message_id is not a valid UUID', () => {
      return sequelize.transaction().then(t =>
        HealthRecordManifest.findOrCreateOne('not-valid', t)
          .catch(error => {
            expect(error).not.toBeNull();
            return expect(error.message).toBe('invalid input syntax for type uuid: "not-valid"');
          })
          .finally(() => t.rollback())
      );
    });

    it('should return if record exists', () => {
      return sequelize.transaction().then(t =>
        HealthRecordManifest.findOrCreateOne(expectedMessageId, t)
          .then(manifest => {
            expect(manifest.get().id).toBe(expectedUUID);
            return expect(manifest.get().health_record_id).toBe(expectedHealthRecordId);
          })
          .finally(() => t.rollback())
      );
    });

    it('should create and return a new record if it does not exist', () => {
      return sequelize.transaction().then(t =>
        HealthRecordManifest.findOrCreateOne(testUUID, t)
          .then(manifest => {
            expect(manifest.get().id).not.toBeNull();
            return expect(manifest.get().message_id).toBe(testUUID);
          })
          .finally(() => t.rollback())
      );
    });
  });
});
