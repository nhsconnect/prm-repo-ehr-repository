import { save, saveHealthCheck } from './db';
import ModelFactory from '../database/models';
import uuid from 'uuid/v4';

describe('db', () => {
  let HealthRecord;

  const storageFile = uuid();
  const nhsNumber = '198765';

  beforeEach(() => {
    process.env.DATABASE_USER = 'deductions_user';
    process.env.DATABASE_PASSWORD = 'secret';
    process.env.DATABASE_NAME = 'deductions_test';
    process.env.DATABASE_HOST = '127.0.0.1';

    HealthRecord = ModelFactory.getByName('HealthRecord');
  });

  afterAll(() => {
    ModelFactory.sequelize.close();
  });

  describe('save', () => {
    it('should save the nhs number and storage location to the db', () => {
      return save(nhsNumber, storageFile).then(() => {
        return expect(
          HealthRecord.findOne({ where: { patient_id: nhsNumber } }).then(result => {
            return expect(result.dataValues.slug).toBe(storageFile);
          })
        );
      });
    });
  });

  describe('saveHealthCheckToDB', () => {
    it('should save the timestamp to the db in health table', () => {
      return saveHealthCheck().then(value => {
        expect(value.connection).toBe(true);
        expect(value.writable).toBe(true);
        return expect(value.type).toBe('postgresql');
      });
    });
  });
});
