import { v4 as uuid } from 'uuid';
import ModelFactory from '../../index';
import { modelName } from '../../health-record-manifest';

jest.mock('uuid');

const testUUID = 'f1e34360-cf9d-4394-bd2f-2f9d61b202fc';
uuid.mockImplementation(() => testUUID);

describe('HealthRecordManifest', () => {
  const HealthRecordManifest = ModelFactory.getByName(modelName);
  const sequelize = ModelFactory.sequelize;

  const uuidPattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
  const messageIdPattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

  afterAll(() => {
    sequelize.close();
  });

  it('should return id as a valid uuid', () => {
    return HealthRecordManifest.findOne().then(healthRecordManifest =>
      expect(healthRecordManifest.get().id).toMatch(uuidPattern)
    );
  });

  it('should return a valid message_id', () => {
    return HealthRecordManifest.findOne().then(healthRecordManifest =>
      expect(healthRecordManifest.get().message_id).toMatch(messageIdPattern)
    );
  });

  it('should return null object for completed_at', () => {
    return HealthRecordManifest.findOne().then(healthRecordManifest =>
      expect(healthRecordManifest.get().completed_at).toBeNull()
    );
  });

  it('should return Date object for created_at', () => {
    return HealthRecordManifest.findOne().then(healthRecordManifest =>
      expect(typeof healthRecordManifest.get().created_at).toBe(typeof new Date())
    );
  });

  it('should return Date object for updated_at', () => {
    return HealthRecordManifest.findOne().then(healthRecordManifest =>
      expect(typeof healthRecordManifest.get().updated_at).toBe(typeof new Date())
    );
  });

  it('should return null for deleted_at', () => {
    return HealthRecordManifest.findOne().then(healthRecordManifest =>
      expect(healthRecordManifest.get().deleted_at).toBe(null)
    );
  });

  it('should return 1 for items deleted and deleted_at should have been updated', () => {
    const healthRecordManifestId = {
      id: 'f0a906ef-49b6-49a8-89f1-cb063d31c4dc'
    };

    return sequelize.transaction().then(t =>
      HealthRecordManifest.destroy({ ...where(healthRecordManifestId), transaction: t })
        .then(destroyed => expect(destroyed).toBe(1))
        .then(() =>
          HealthRecordManifest.findOne({
            ...where(healthRecordManifestId),
            paranoid: false,
            transaction: t
          })
        )
        .then(healthRecordManifest =>
          expect(typeof healthRecordManifest.get().deleted_at).toBe(typeof new Date())
        )
        .finally(() => t.rollback())
    );
  });

  it('should return 1 for items restored and deleted_at should have been removed', () => {
    const healthRecordManifestId = {
      id: 'fdc11256-f3d5-435f-a814-c2f1530566f4'
    };

    return sequelize.transaction().then(t =>
      HealthRecordManifest.restore({
        ...where(healthRecordManifestId),
        paranoid: false,
        transaction: t
      })
        .then(restored => expect(restored).toBe(1))
        .then(() =>
          HealthRecordManifest.findOne({ ...where(healthRecordManifestId), transaction: t })
        )
        .then(healthRecordManifest =>
          expect(typeof healthRecordManifest.get().deleted_at).toBe(typeof new Date())
        )
        .finally(() => t.rollback())
    );
  });

  it('should not return anything if record has been destroyed (soft)', () => {
    const healthRecordManifestId = {
      id: 'fdc11256-f3d5-435f-a814-c2f1530566f4'
    };

    return HealthRecordManifest.findOne(where(healthRecordManifestId)).then(value =>
      expect(value).toBeNull()
    );
  });

  it('should create new entry using model', () => {
    const newHealthRecordManifest = {
      message_id: uuid()
    };

    return sequelize.transaction().then(t =>
      HealthRecordManifest.create(newHealthRecordManifest, { transaction: t })
        .then(healthRecordManifest => {
          expect(healthRecordManifest.get().created_at).not.toBeNull();
          expect(healthRecordManifest.get().updated_at).not.toBeNull();
          expect(healthRecordManifest.get().deleted_at).toBeNull();
          expect(healthRecordManifest.get().completed_at).toBeNull();
          expect(healthRecordManifest.get().message_id).toMatch(newHealthRecordManifest.message_id);
          return expect(healthRecordManifest.get().id).toMatch(testUUID);
        })
        .finally(() => t.rollback())
    );
  });

  it('should update the updated_at with a record update', () => {
    const healthRecordManifestId = {
      id: 'd65c74cb-5b74-4185-8404-f5284fd5ce89'
    };

    return sequelize.transaction().then(t =>
      HealthRecordManifest.update(
        { message_id: uuid() },
        { ...where(healthRecordManifestId), transaction: t }
      )
        .then(updated => expect(updated[0]).toBe(1))
        .then(() =>
          HealthRecordManifest.findOne({ ...where(healthRecordManifestId), transaction: t })
        )
        .then(healthRecordManifest =>
          expect(healthRecordManifest.get().updated_at.toISOString()).not.toBe(
            healthRecordManifest.get().created_at.toISOString()
          )
        )
        .finally(() => t.rollback())
    );
  });

  it('should update the completed_at with Date when complete is called', () => {
    const healthRecordManifestId = {
      id: 'f0a906ef-49b6-49a8-89f1-cb063d31c4dc'
    };

    return sequelize.transaction().then(t =>
      HealthRecordManifest.complete({ ...where(healthRecordManifestId), transaction: t })
        .then(completed => expect(completed).toContain(1))
        .then(() =>
          HealthRecordManifest.findOne({ ...where(healthRecordManifestId), transaction: t })
        )
        .then(healthRecordManifest =>
          expect(healthRecordManifest.get().completed_at).not.toBeNull()
        )
        .finally(() => t.rollback())
    );
  });
});

const where = body => ({ where: body });
