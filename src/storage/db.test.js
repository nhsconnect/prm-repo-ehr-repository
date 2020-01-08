import { checkDbHealth } from './db';
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

  describe('checkDbHealth', () => {
    it('should return the db health', () => {
      return checkDbHealth().then(value => {
        expect(value.type).toEqual('postgresql');
        expect(value.connection).toEqual(true);
        expect(value.writable).toEqual(true);
      });
    });
  });
});
