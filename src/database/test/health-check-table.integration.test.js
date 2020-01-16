import ModelFactory from '../models';
import uuid from 'uuid/v4';

const testUUID = '74c6230b-36d9-4940-bdd6-495ba87ed634';

jest.mock('uuid/v4');

describe('models.HealthCheck', () => {
  const HealthCheck = ModelFactory.getByName('HealthCheck');

  const uuidPattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

  beforeEach(() => {
    uuid.mockImplementation(() => testUUID);
  });

  afterAll(() => {
    return ModelFactory.sequelize.close();
  });

  it('should return id as a valid uuid', () => {
    return HealthCheck.findAll({}).then(value => {
      return expect(value[0].dataValues.id).toMatch(uuidPattern);
    });
  });

  it('should return Date object for created_at', () => {
    return HealthCheck.findAll({}).then(value => {
      return expect(typeof value[0].dataValues.created_at).toBe(typeof new Date());
    });
  });

  it('should return Date object for updated_at', () => {
    return HealthCheck.findAll({}).then(value => {
      return expect(typeof value[0].dataValues.updated_at).toBe(typeof new Date());
    });
  });

  it('should return null for deleted_at', () => {
    return HealthCheck.findAll({}).then(value => {
      return expect(value[0].dataValues.deleted_at).toBe(null);
    });
  });

  it('should automatically created the id when a record is created', () => {
    return HealthCheck.create()
      .then(value => {
        return expect(value.dataValues.id).toBe(testUUID);
      })
      .finally(() => {
        return HealthCheck.destroy({ where: { id: testUUID }, paranoid: false, force: true }).then(
          response => {
            return expect(response).toBe(1);
          }
        );
      });
  });
});
