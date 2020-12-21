import ModelFactory from '../../index';

import uuid from 'uuid/v4';
import { modelName } from '../../health-check';

const testUUID = '74c6230b-36d9-4940-bdd6-495ba87ed634';

jest.mock('uuid/v4');

describe('models.HealthCheck', () => {
  const HealthCheck = ModelFactory.getByName(modelName);
  const sequelize = ModelFactory.sequelize;

  const uuidPattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

  beforeEach(() => {
    uuid.mockImplementation(() => testUUID);
  });

  afterAll(() => {
    sequelize.close();
  });

  it('should return id as a valid uuid', () => {
    return HealthCheck.findOne().then(healthChecks =>
      expect(healthChecks.get().id).toMatch(uuidPattern)
    );
  });

  it('should return Date object for created_at', () => {
    return HealthCheck.findOne().then(healthChecks =>
      expect(typeof healthChecks.get().created_at).toBe(typeof new Date())
    );
  });

  it('should return Date object for updated_at', () => {
    return HealthCheck.findOne().then(healthChecks =>
      expect(typeof healthChecks.get().updated_at).toBe(typeof new Date())
    );
  });

  it('should return null for deleted_at', () => {
    return HealthCheck.findOne().then(healthChecks =>
      expect(healthChecks.get().deleted_at).toBe(null)
    );
  });

  it('should automatically created the id when a record is created', () => {
    return sequelize.transaction().then(t =>
      HealthCheck.create({}, { transaction: t })
        .then(value => expect(value.get().id).toBe(testUUID))
        .finally(() => t.rollback())
    );
  });
});
