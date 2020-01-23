import ModelFactory from '../../models';

describe('MessageFragment integration', () => {
  const sequelize = ModelFactory.sequelize;
  const MessageFragment = ModelFactory.getByName('MessageFragment');

  const testUUID = 'f72b6225-1cac-43d7-85dd-a0b5b4211cd9';

  const expectedUUID = '74c6230b-36d9-4940-bdd6-495ba87ed634';
  const expectedMessageId = '8c0f741e-82fa-46f1-9686-23a1c08657f1';
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
        MessageFragment.findOrCreateOne('not-valid', t)
          .catch(error => {
            expect(error).not.toBeNull();
            return expect(error.message).toBe('invalid input syntax for type uuid: "not-valid"');
          })
          .finally(() => t.rollback())
      );
    });

    it('should return if record exists', () => {
      return sequelize.transaction().then(t =>
        MessageFragment.findOrCreateOne(expectedMessageId, t)
          .then(fragment => {
            expect(fragment.get().id).toBe(expectedUUID);
            return expect(fragment.get().health_record_id).toBe(expectedHealthRecordId);
          })
          .finally(() => t.rollback())
      );
    });

    it('should create and return a new record if it does not exist', () => {
      return sequelize.transaction().then(t =>
        MessageFragment.findOrCreateOne(testUUID, t)
          .then(fragment => {
            expect(fragment.get().id).not.toBeNull();
            return expect(fragment.get().message_id).toBe(testUUID);
          })
          .finally(() => t.rollback())
      );
    });
  });


  describe('withHealthRecord', () => {
    it('should associate the message fragment with the health record by conversation_id', () => {
      return sequelize.transaction().then(t =>
        MessageFragment.findOrCreateOne(testUUID, t)
          .then(fragment => {
            return fragment.withHealthRecord('3244a7bb-555e-433b-b2cc-1aa8178da99e', t);
          })
          .then(fragment => {
            expect(fragment).not.toBeNull();
            return expect(fragment.get().health_record_id).toBe(expectedHealthRecordId);
          })
          .finally(() => t.rollback())
      );
    });

    it('should reject with error if conversation_id is invalid', () => {
      return sequelize.transaction().then(t =>
        MessageFragment.findOrCreateOne(testUUID, t)
          .then(fragment => {
            return fragment.withHealthRecord('invalid', t);
          })
          .catch(error => {
            expect(error).not.toBeNull();
            return expect(error.message).toBe(
              'invalid input syntax for type uuid: "invalid"'
            );
          })
          .finally(() => t.rollback())
      );
    });
  });
});
