import ModelFactory from '../../index';

describe('HealthRecordManifest integration', () => {
  const sequelize = ModelFactory.sequelize;
  const HealthRecordManifest = ModelFactory.getByName('HealthRecordManifest');

  const testUUID = 'f72b6225-1cac-43d7-85dd-a0b5b4211cd9';

  const expectedUUID = 'f0a906ef-49b6-49a8-89f1-cb063d31c4dc';
  const expectedMessageId = '93b699fc-03fb-438f-b5a1-ce936e0f9d4e';
  const expectedHealthRecordId = '99ba0ba1-ed1a-4fc1-ab5b-9d79af71aef4';

  const uuidPattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

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

  describe('includeMessageFragment', () => {
    it('should associate one new message fragment with one new manifest', () => {
      const testMessageId = '720a0b70-a336-4095-8e02-248ec665b95c';

      return sequelize.transaction().then(t =>
        HealthRecordManifest.findOrCreateOne(testUUID, t)
          .then(manifest => {
            expect(manifest.get().message_id).toBe(testUUID);
            return manifest.includeMessageFragment(testMessageId, t).then(() => manifest);
          })
          .then(manifest => {
            return manifest.getMessageFragments({ transaction: t });
          })
          .then(fragment => {
            expect(fragment).not.toBeNull();
            return expect(fragment[0].get().message_id).toBe(testMessageId);
          })
          .finally(() => t.rollback())
      );
    });

    it('should associate one new message fragment with an existing manifest', () => {
      const testMessageId = '720a0b70-a336-4095-8e02-248ec665b95c';

      return sequelize.transaction().then(t =>
        HealthRecordManifest.findOrCreateOne(expectedMessageId, t)
          .then(manifest => {
            expect(manifest.get().id).toBe(expectedUUID);
            return manifest.includeMessageFragment(testMessageId, t).then(() => manifest);
          })
          .then(manifest => {
            return manifest.getMessageFragments({ transaction: t });
          })
          .then(fragment => {
            expect(fragment).not.toBeNull();
            return expect(fragment[2].get().message_id).toBe(testMessageId);
          })
          .finally(() => t.rollback())
      );
    });

    it('should associate one existing message fragment with a new manifest', () => {
      const existingFragmentMessageId = '8c0f741e-82fa-46f1-9686-23a1c08657f1';
      const existingFragmentUUID = '74c6230b-36d9-4940-bdd6-495ba87ed634';

      const testMessageId = '720a0b70-a336-4095-8e02-248ec665b95c';

      return sequelize.transaction().then(t =>
        HealthRecordManifest.findOrCreateOne(testMessageId, t)
          .then(manifest => {
            expect(manifest.get().message_id).toBe(testMessageId);
            return manifest
              .includeMessageFragment(existingFragmentMessageId, t)
              .then(() => manifest);
          })
          .then(manifest => {
            return manifest.getMessageFragments({ transaction: t });
          })
          .then(fragment => {
            expect(fragment).not.toBeNull();
            expect(fragment[0].get().id).toBe(existingFragmentUUID);
            return expect(fragment[0].get().message_id).toBe(existingFragmentMessageId);
          })
          .finally(() => t.rollback())
      );
    });

    it('should throw error if message id of message fragment is invalid', () => {
      const testMessageId = 'invalid_uuid';

      return sequelize.transaction().then(t =>
        HealthRecordManifest.findOrCreateOne(expectedMessageId, t)
          .then(manifest => {
            expect(manifest.get().id).toBe(expectedUUID);
            return manifest.includeMessageFragment(testMessageId, t).then(() => manifest);
          })
          .catch(error => {
            expect(error).not.toBeNull();
            return expect(error.message).toBe('invalid input syntax for type uuid: "invalid_uuid"');
          })
          .finally(() => t.rollback())
      );
    });
  });

  describe('includesMessageFragments', () => {
    it('should reject if one message fragment id is invalid', () => {
      const testMessageId1 = '720a0b70-a336-4095-8e02-248ec665b95c';

      return sequelize.transaction().then(t =>
        HealthRecordManifest.findOrCreateOne(testUUID, t)
          .then(manifest => {
            expect(manifest.get().message_id).toBe(testUUID);
            return manifest
              .includesMessageFragments([testMessageId1, 'invalid'], t)
              .then(() => manifest);
          })
          .catch(error => {
            expect(error).not.toBeNull();
            return expect(error.message).toBe('invalid input syntax for type uuid: "invalid"');
          })
          .finally(() => t.rollback())
      );
    });

    it('should associate multiple new message fragment with one new manifest', () => {
      const testMessageId1 = '720a0b70-a336-4095-8e02-248ec665b95c';
      const testMessageId2 = '920a0b70-a336-4095-8e02-248ec665b95d';

      return sequelize.transaction().then(t =>
        HealthRecordManifest.findOrCreateOne(testUUID, t)
          .then(manifest => {
            expect(manifest.get().message_id).toBe(testUUID);
            return manifest
              .includesMessageFragments([testMessageId1, testMessageId2], t)
              .then(() => manifest);
          })
          .then(manifest => {
            return manifest.getMessageFragments({ transaction: t });
          })
          .then(fragments => {
            expect(fragments).not.toBeNull();
            expect(fragments[0].get().message_id).toMatch(uuidPattern);
            return expect(fragments[1].get().message_id).toMatch(uuidPattern);
          })
          .finally(() => t.rollback())
      );
    });
  });
});
