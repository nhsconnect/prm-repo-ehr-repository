import request from 'supertest';
import app from '../../app';
import { updateLogEventWithError } from '../../middleware/logging';

jest.mock('../../middleware/logging');

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

  it('should call updateLogEvent with error with error message', done => {
    request(app)
      .get('/error')
      .expect(() => {
        expect(updateLogEventWithError).toHaveBeenCalledTimes(1);
        expect(updateLogEventWithError).toHaveBeenCalledWith(
          Error('TEST: EHR Repo Error logging test entry')
        );
      })
      .end(done);
  });
});
