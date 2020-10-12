import ModelFactory from '../../index';

describe('HealthRecord integration', () => {
  const sequelize = ModelFactory.sequelize;
  const HealthRecord = ModelFactory.getByName('HealthRecord');

  const testUUID = 'f72b6225-1cac-43d7-85dd-a0b5b4211cd9';
  const isLargeMessage = true;

  const expectedUuid = '7d5712f2-d203-4f11-8527-1175db0d2a4a';
  const expectedConvoId = '8ab7f61f-0e6b-4378-8cac-dcb4f9e3ec54';
  const expectedPatientId = 'e479ca12-4a7d-41cb-86a2-775f36b8a0d1';

  afterAll(() => {
    sequelize.close();
  });

  describe('findOrCreateOne', () => {
    it('should reject with error if conversation_id is not a valid UUID', () => {
      return sequelize.transaction().then(t =>
        HealthRecord.findOrCreateOne('not-valid', true, t)
          .catch(error => {
            expect(error).not.toBeNull();
            return expect(error.message).toBe('invalid input syntax for type uuid: "not-valid"');
          })
          .finally(() => t.rollback())
      );
    });

    it('should return if record exists', () => {
      return sequelize.transaction().then(t =>
        HealthRecord.findOrCreateOne(expectedConvoId, isLargeMessage, t)
          .then(healthRecord => {
            expect(healthRecord.get().id).toBe(expectedUuid);
            return expect(healthRecord.get().patient_id).toBe(expectedPatientId);
          })
          .finally(() => t.rollback())
      );
    });

    it('should create and return a new record if it does not exist', () => {
      return sequelize.transaction().then(t =>
        HealthRecord.findOrCreateOne(testUUID, isLargeMessage, t)
          .then(healthRecord => {
            expect(healthRecord.get().id).not.toBeNull();
            return expect(healthRecord.get().conversation_id).toBe(testUUID);
          })
          .finally(() => t.rollback())
      );
    });

    it('should create and return a new record including a large msg status if it does not exist', () => {
      return sequelize.transaction().then(t =>
        HealthRecord.findOrCreateOne(testUUID, isLargeMessage, t)
          .then(healthRecord => {
            expect(healthRecord.get().is_large_message).not.toBeNull();
            return expect(healthRecord.get().is_large_message).toBe(true);
          })
          .finally(() => t.rollback())
      );
    });
  });

  describe('withPatient', () => {
    it('should associate the health record with the patient by nhs_number', () => {
      return sequelize.transaction().then(t =>
        HealthRecord.findOrCreateOne(testUUID, isLargeMessage, t)
          .then(healthRecord => {
            return healthRecord.withPatient('1111111111', t);
          })
          .then(healthRecord => {
            expect(healthRecord).not.toBeNull();
            return expect(healthRecord.get().patient_id).toBe(expectedPatientId);
          })
          .finally(() => t.rollback())
      );
    });

    it('should reject with error if nhs_number is invalid', () => {
      return sequelize.transaction().then(t =>
        HealthRecord.findOrCreateOne(testUUID, isLargeMessage, t)
          .then(healthRecord => {
            return healthRecord.withPatient('111111', t);
          })
          .catch(error => {
            expect(error).not.toBeNull();
            return expect(error.message).toBe(
              'Validation error: Validation len on nhs_number failed'
            );
          })
          .finally(() => t.rollback())
      );
    });
  });

  describe('withHealthRecord', () => {
    const conversationId = '3244a7bb-555e-433b-b2cc-1aa8178da99e';
    const expectedHealthRecordId = '99ba0ba1-ed1a-4fc1-ab5b-9d79af71aef4';

    it('should associate the health record manifest with the health record by conversation_id', () => {
      return sequelize.transaction().then(t =>
        HealthRecord.findOrCreateOne(conversationId, isLargeMessage, t)
          .then(healthRecord => {
            return healthRecord.hasManifest('b6d2073d-2381-4d5c-bd10-0d016161588e', t);
          })
          .then(healthRecord => {
            expect(healthRecord).not.toBeNull();
            return healthRecord.getHealthRecordManifests({ transaction: t });
          })
          .then(manifests =>
            expect(manifests[0].get().health_record_id).toBe(expectedHealthRecordId)
          )
          .finally(() => t.rollback())
      );
    });

    it('should reject with error if the conversation_id is invalid', () => {
      return sequelize.transaction().then(t =>
        HealthRecord.findOrCreateOne(testUUID, isLargeMessage, t)
          .then(healthRecord => {
            return healthRecord.hasManifest('invalid', t);
          })
          .catch(error => {
            expect(error).not.toBeNull();
            return expect(error.message).toBe('invalid input syntax for type uuid: "invalid"');
          })
          .finally(() => t.rollback())
      );
    });

    it('should retrieve the health record by conversation_id', () => {
      return sequelize.transaction().then(t =>
        HealthRecord.findByConversationId(conversationId, t)
          .then(healthRecord => {
            return healthRecord.hasManifest('b6d2073d-2381-4d5c-bd10-0d016161588e', t);
          })
          .then(healthRecord => {
            expect(healthRecord).not.toBeNull();
            return healthRecord.getHealthRecordManifests({ transaction: t });
          })
          .then(manifests =>
            expect(manifests[0].get().health_record_id).toBe(expectedHealthRecordId)
          )
          .finally(() => t.rollback())
      );
    });
  });
});
