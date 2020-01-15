import request from 'supertest';
import app from '../app';
import { updateLogEventWithError } from '../middleware/logging';

jest.mock('../config/logging');
jest.mock('../middleware/logging', () => mockLoggingMiddleware());
jest.mock('express-winston', () => mockExpressWinston());

describe('GET /error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200', done => {
    request(app)
      .get('/error')
      .expect(200)
      .expect(res => {
        expect(res.text).toEqual('Added test Error to the log');
      })
      .end(done);
  });

  it('should log event with error', done => {
    request(app)
      .get('/error')
      .expect(200)
      .expect(() => {
        expect(updateLogEventWithError).toHaveBeenCalledTimes(1);
        expect(updateLogEventWithError).toHaveBeenCalledWith(
          Error('TEST: EHR Repo Error logging test entry')
        );
      })
      .end(done);
  });
});

function mockLoggingMiddleware() {
  const original = jest.requireActual('../middleware/logging');
  return {
    ...original,
    updateLogEvent: jest.fn(),
    updateLogEventWithError: jest.fn()
  };
}

function mockExpressWinston() {
  return {
    errorLogger: () => (req, res, next) => next(),
    logger: () => (req, res, next) => next()
  };
}
