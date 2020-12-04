import request from 'supertest';
import app from '../../../app';
import { logError } from '../../../middleware/logging';

jest.mock('../../../middleware/logging');

describe('GET /error', () => {
  it('should return 200', done => {
    request(app)
      .get('/error')
      .expect(201)
      .end(done);
  });

  it('should respond with a descriptive message', done => {
    request(app)
      .get('/error')
      .expect(res => {
        expect(res.text).toEqual('Added test Error to the log');
      })
      .end(done);
  });

  it('should call logError with error with error message', done => {
    request(app)
      .get('/error')
      .expect(() => {
        expect(logError).toHaveBeenCalledTimes(1);
        expect(logError).toHaveBeenCalledWith('TEST: EHR Repo Error logging test entry');
      })
      .end(done);
  });
});
