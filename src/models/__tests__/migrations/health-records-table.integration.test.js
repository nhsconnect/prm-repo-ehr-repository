import { v4 as uuid } from 'uuid';
import ModelFactory from '../../index';
import { modelName } from '../../health-record';

jest.mock('uuid');

const testUUID = '0af9f62f-0e6b-4378-8cfc-dcb4f9e3ec54';
uuid.mockImplementation(() => testUUID);

describe('HealthRecord', () => {
  const HealthRecord = ModelFactory.getByName(modelName);
  const sequelize = ModelFactory.sequelize;

  const uuidPattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
  const convoIdPattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

  afterAll(() => {
    sequelize.close();
  });

  it('should return id as a valid uuid', () => {
    return HealthRecord.findOne().then(healthRecord =>
      expect(healthRecord.get().id).toMatch(uuidPattern)
    );
  });

  it('should return the valid patient_id as an Integer', () => {
    return HealthRecord.findOne().then(healthRecord =>
      expect(healthRecord.get().patient_id).toMatch(uuidPattern)
    );
  });

  it('should return a valid conversation_id', () => {
    return HealthRecord.findOne().then(healthRecord =>
      expect(healthRecord.get().conversation_id).toMatch(convoIdPattern)
    );
  });

  it('should return Date object for created_at', () => {
    return HealthRecord.findOne().then(healthRecord =>
      expect(typeof healthRecord.get().created_at).toBe(typeof new Date())
    );
  });

  it('should return Date object for updated_at', () => {
    return HealthRecord.findOne().then(healthRecord =>
      expect(typeof healthRecord.get().updated_at).toBe(typeof new Date())
    );
  });

  it('should return null for deleted_at', () => {
    return HealthRecord.findOne().then(value => expect(value.get().deleted_at).toBe(null));
  });

  it('should return 1 for items deleted and deleted_at should have been updated', () => {
    const healthRecordId = {
      id: '99ba0ba1-ed1a-4fc1-ab5b-9d79af71aef4'
    };

    return sequelize.transaction().then(t =>
      HealthRecord.destroy({ ...where(healthRecordId), transaction: t })
        .then(destroyed => expect(destroyed).toBe(1))
        .then(() =>
          HealthRecord.findOne({ ...where(healthRecordId), paranoid: false, transaction: t })
        )
        .then(healthRecord => {
          expect(healthRecord.get().deleted_at).not.toBeNull();
          return expect(typeof healthRecord.get().deleted_at).toBe(typeof new Date());
        })
        .finally(() => t.rollback())
    );
  });

  it('should return 1 for items restored and deleted_at should have been removed', () => {
    const healthRecordId = {
      id: '0879b920-7174-4ef1-92f7-12383114b052'
    };

    return sequelize.transaction().then(t =>
      HealthRecord.restore({ ...where(healthRecordId), paranoid: false, transaction: t })
        .then(restored => expect(restored).toBe(1))
        .then(() => HealthRecord.findOne({ ...where(healthRecordId), transaction: t }))
        .then(healthRecord => expect(healthRecord.get().deleted_at).toBeNull())
        .finally(() => t.rollback())
    );
  });

  it('should not return anything if record has been destroyed (soft)', () => {
    const healthRecordId = {
      id: '0879b920-7174-4ef1-92f7-12383114b052'
    };

    return HealthRecord.findOne(where(healthRecordId)).then(healthRecord =>
      expect(healthRecord).toBeNull()
    );
  });

  it('should create new entry using model', () => {
    const new_entry_params = {
      conversation_id: uuid(),
      id: testUUID
    };

    return sequelize.transaction().then(t =>
      HealthRecord.create(new_entry_params, { transaction: t })
        .then(healthRecord => {
          expect(healthRecord.get().created_at).not.toBeNull();
          expect(healthRecord.get().updated_at).not.toBeNull();
          expect(healthRecord.get().deleted_at).toBeNull();
          expect(healthRecord.get().completed_at).toBeNull();
          expect(healthRecord.get().patient_id).toBeNull();
          expect(healthRecord.get().conversation_id).toMatch(new_entry_params.conversation_id);
          return expect(healthRecord.get().id).toMatch(testUUID);
        })
        .finally(() => t.rollback())
    );
  });

  it('should update the updated_at with a record update', () => {
    const healthRecordId = {
      id: '7d5712f2-d203-4f11-8527-1175db0d2a4a'
    };

    return sequelize.transaction().then(t =>
      HealthRecord.update(
        { completed_at: new Date() },
        { ...where(healthRecordId), transaction: t }
      )
        .then(updated => expect(updated[0]).toBe(1))
        .then(() => HealthRecord.findOne({ ...where(healthRecordId), transaction: t }))
        .then(healthRecord =>
          expect(healthRecord.get().updated_at.toISOString()).not.toBe(
            healthRecord.get().created_at.toISOString()
          )
        )
        .finally(() => t.rollback())
    );
  });

  it('should update the completed_at with Date when complete is called', () => {
    const healthRecordId = {
      id: '7d5712f2-d203-4f11-8527-1175db0d2a4a'
    };

    return sequelize.transaction().then(t =>
      HealthRecord.complete({ ...where(healthRecordId), transaction: t })
        .then(completed => expect(completed).toContain(1))
        .then(() => HealthRecord.findOne({ ...where(healthRecordId), transaction: t }))
        .then(healthRecord => expect(healthRecord.get().completed_at).not.toBeNull())
        .finally(() => t.rollback())
    );
  });
});

const where = body => ({ where: body });
