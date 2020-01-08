import { saveHealthCheck } from './db';
import ModelFactory from '../database/models';

describe('db', () => {
  beforeEach(() => {
    process.env.DATABASE_USER = 'deductions_user';
    process.env.DATABASE_PASSWORD = 'secret';
    process.env.DATABASE_NAME = 'deductions_test';
    process.env.DATABASE_HOST = '127.0.0.1';
  });

  afterAll(() => {
    ModelFactory.sequelize.close();
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
