import request from 'supertest';
import app from '../../../app';

jest.mock('../../../middleware/logging');
jest.mock('../../../middleware/auth');

describe('GET /patients', () => {
  const testEndpoint = `/patients`;

  describe('success', () => {
    it('should return 200', done => {
      request(app)
        .get(testEndpoint)
        .expect(200)
        .end(done);
    });
  });
});
