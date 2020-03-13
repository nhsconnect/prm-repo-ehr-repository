import { checkDbHealth } from '../check-db-health';
import ModelFactory from '../../../models';

describe('db', () => {
  afterAll(() => {
    ModelFactory.sequelize.close();
  });

  describe('checkDbHealth', () => {
    it('should return the db health', () => {
      return checkDbHealth().then(value => {
        expect(value).toEqual({
          type: 'postgresql',
          connection: true,
          writable: true
        });
      });
    });
  });
});
