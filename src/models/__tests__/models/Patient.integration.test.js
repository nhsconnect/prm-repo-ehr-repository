import ModelFactory from '../../index';

describe('Patient integration', () => {
  const sequelize = ModelFactory.sequelize;
  const Patient = ModelFactory.getByName('Patient');

  const nhsNumber = '0192837465';
  const existingNhsNumber = '1111111111';
  const existingUUID = 'e479ca12-4a7d-41cb-86a2-775f36b8a0d1';

  afterAll(() => {
    sequelize.close();
  });

  describe('findOrCreateOne', () => {
    it('should reject with error if nhs_number contains alpha characters', () => {
      return sequelize.transaction().then(t =>
        Patient.findOrCreateOne('abcdefghij', t)
          .catch(error => {
            expect(error).not.toBeNull();
            return expect(error.message).toBe(
              'Validation error: Validation isNumeric on nhs_number failed'
            );
          })
          .finally(() => t.rollback())
      );
    });

    it('should reject with error if nhs_number is too short', () => {
      return sequelize.transaction().then(t =>
        Patient.findOrCreateOne('123456789', t)
          .catch(error => {
            expect(error).not.toBeNull();
            return expect(error.message).toBe(
              'Validation error: Validation len on nhs_number failed'
            );
          })
          .finally(() => t.rollback())
      );
    });

    it('should reject with errorif nhs_number is too long', () => {
      return sequelize.transaction().then(t =>
        Patient.findOrCreateOne('12345678901', t)
          .catch(error => {
            expect(error).not.toBeNull();
            return expect(error.message).toBe('value too long for type character(10)');
          })
          .finally(() => t.rollback())
      );
    });

    it('should find existing patient and return it', () => {
      return sequelize.transaction().then(t =>
        Patient.findOrCreateOne(existingNhsNumber, t)
          .then(patient => {
            expect(patient.get().nhs_number).toBe(existingNhsNumber);
            return expect(patient.get().id).toBe(existingUUID);
          })
          .finally(() => t.rollback())
      );
    });

    it('should create new patient and return it', () => {
      return sequelize.transaction().then(t =>
        Patient.findOrCreateOne(nhsNumber, t)
          .then(patient => {
            return expect(patient.get().nhs_number).toBe(nhsNumber);
          })
          .finally(() => t.rollback())
      );
    });
  });
});
