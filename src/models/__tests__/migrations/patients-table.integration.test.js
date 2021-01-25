import ModelFactory from '../../index';
import { modelName } from '../../patient';

describe('Patient', () => {
  const Patient = ModelFactory.getByName(modelName);
  const sequelize = ModelFactory.sequelize;
  const uuidPattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
  const nhsNumberPattern = /^[0-9]{10}$/;

  afterAll(() => {
    sequelize.close();
  });

  it('should return id as a valid uuid', () => {
    return Patient.findOne().then(patient => expect(patient.get().id).toMatch(uuidPattern));
  });

  it('should return a valid nhs_number made of 10 numbers', () => {
    return Patient.findOne().then(patient =>
      expect(patient.get().nhs_number).toMatch(nhsNumberPattern)
    );
  });

  it('should return Date object for created_at', () => {
    return Patient.findOne().then(patient =>
      expect(typeof patient.get().created_at).toBe(typeof new Date())
    );
  });

  it('should return Date object for updated_at', () => {
    return Patient.findOne().then(patient =>
      expect(typeof patient.get().updated_at).toBe(typeof new Date())
    );
  });

  it('should return null for deleted_at', () => {
    return Patient.findOne().then(patient => expect(patient.get().deleted_at).toBe(null));
  });

  it('should return 1 for items deleted and deleted_at should have been updated', () => {
    const patientId = {
      id: 'd126ee7f-035e-4938-8996-09a28c2ba61c'
    };

    return sequelize.transaction().then(t =>
      Patient.destroy({ ...where(patientId), transaction: t })
        .then(destroyed => expect(destroyed).toBe(1))
        .then(() => Patient.findOne({ ...where(patientId), paranoid: false, transaction: t }))
        .then(patient => {
          expect(patient.get().id).toBe(patientId.id);
          return expect(typeof patient.get().deleted_at).toBe(typeof new Date());
        })
        .finally(() => t.rollback())
    );
  });

  it('should return 1 for items restored and deleted_at should have been removed', () => {
    const patientId = {
      id: '944513e3-9f12-4284-b23c-8c319dbd3599'
    };

    return sequelize.transaction().then(t =>
      Patient.restore({ ...where(patientId), paranoid: false, transaction: t })
        .then(restored => expect(restored).toBe(1))
        .then(() => Patient.findOne({ ...where(patientId), transaction: t }))
        .then(patient => {
          expect(patient.get().id).toBe(patientId.id);
          return expect(typeof patient.get().deleted_at).toBe(typeof new Date());
        })
        .finally(() => t.rollback())
    );
  });

  it('should not return anything if record has been destroyed (soft)', () => {
    const patientId = {
      id: '944513e3-9f12-4284-b23c-8c319dbd3599'
    };

    return Patient.findOne(where(patientId)).then(patient => expect(patient).toBeNull());
  });

  it('should create new entry using model', () => {
    const newPatient = {
      nhs_number: '4444444444'
    };
    return sequelize.transaction().then(t =>
      Patient.create(newPatient, { transaction: t })
        .then(patient => {
          expect(patient.get().created_at).not.toBeNull();
          expect(patient.get().updated_at).not.toBeNull();
          expect(patient.get().deleted_at).toBeNull();
          expect(patient.get().nhs_number).toMatch(newPatient.nhs_number);
          return expect(patient.get().id).toMatch(uuidPattern);
        })
        .finally(() => t.rollback())
    );
  });

  it('should update the updated_at with a record update', () => {
    const patientId = {
      id: 'e479ca12-4a7d-41cb-86a2-775f36b8a0d1'
    };

    return sequelize.transaction().then(t =>
      Patient.update({ nhs_number: 1111121111 }, { ...where(patientId), transaction: t })
        .then(updated => expect(updated[0]).toBe(1))
        .then(() => Patient.findOne({ ...where(patientId), transaction: t }))
        .then(patient =>
          expect(patient.get().updated_at.toISOString()).not.toBe(
            patient.get().created_at.toISOString()
          )
        )
        .finally(() => t.rollback())
    );
  });

  it('should reject with error if not all required parameters are provided', () => {
    const newPatient = {
      nhs_number: null
    };

    return expect(Patient.create(newPatient)).rejects.toThrowError(
      /notNull Violation: Patient.nhs_number cannot be null/i
    );
  });
});

const where = body => ({ where: body });
