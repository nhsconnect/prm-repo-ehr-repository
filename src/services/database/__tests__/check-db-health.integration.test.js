/**
 * @deprecated
 * Postgres DB related stubs
 * To be deleted PRMT-4568
 */
import { checkDbHealth } from '../check-db-health';
// import ModelFactory from '../../../models';

describe.skip('db', () => {
  afterAll(() => {
    // ModelFactory.sequelize.close();
  });

  describe('checkDbHealth', () => {
    it('should return the db health', () => {
      return checkDbHealth().then((value) => {
        expect(value).toEqual({
          type: 'postgresql',
          connection: true,
          writable: true,
        });
      });
    });
  });
});
