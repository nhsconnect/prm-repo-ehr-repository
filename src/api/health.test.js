import app from '../app';
import request from 'supertest';
import { getHealthCheck } from '../services/get-health-check';
import { updateLogEvent, updateLogEventWithError } from '../middleware/logging';

jest.mock('../config/logging');
jest.mock('../services/get-health-check');
jest.mock('../middleware/logging', () => mockLoggingMiddleware());
jest.mock('express-winston', () => mockExpressWinston());

const mockErrorResponse = 'some-error';

describe('GET /health', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and the response from getHealthCheck', done => {
    getHealthCheck.mockReturnValue(Promise.resolve(expectedHealthCheckBase()));

    request(app)
      .get('/health')
      .expect(200)
      .expect(res => {
        expect(res.body).toEqual(expectedHealthCheckBase());
      })
      .end(done);
  });

  it('should call health check service with no parameters', done => {
    getHealthCheck.mockReturnValue(Promise.resolve(expectedHealthCheckBase()));

    request(app)
      .get('/health')
      .expect(() => {
        expect(getHealthCheck).toHaveBeenCalledTimes(1);
      })
      .end(done);
  });

  it('should return 503 status if s3 writable is false', done => {
    getHealthCheck.mockReturnValue(Promise.resolve(expectedHealthCheckBase(false)));

    request(app)
      .get('/health')
      .expect(503)
      .expect(() => {
        expect(updateLogEvent).toHaveBeenCalledWith(expectedHealthCheckBase(false));
      })
      .end(done);
  });

  it('should return 503 status if db writable is false', done => {
    getHealthCheck.mockReturnValue(Promise.resolve(expectedHealthCheckBase(true, true, false)));

    request(app)
      .get('/health')
      .expect(503)
      .expect(() => {
        expect(updateLogEvent).toHaveBeenCalledWith(expectedHealthCheckBase(true, true, false));
      })
      .end(done);
  });

  it('should return 503 status if s3 available is false', done => {
    getHealthCheck.mockReturnValue(Promise.resolve(expectedHealthCheckBase(true, false)));

    request(app)
      .get('/health')
      .expect(503)
      .expect(() => {
        expect(updateLogEvent).toHaveBeenCalledWith(expectedHealthCheckBase(true, false));
      })
      .end(done);
  });

  it('should return 503 if both s3 and db are not writable', done => {
    getHealthCheck.mockReturnValue(
      Promise.resolve(expectedHealthCheckBase(false, false, false, false))
    );

    request(app)
      .get('/health')
      .expect(503)
      .expect(() => {
        expect(updateLogEvent).toHaveBeenCalledWith(
          expectedHealthCheckBase(false, false, false, false)
        );
      })
      .end(done);
  });

  it('should return 500 if getHealthCheck if it cannot provide a healthcheck', done => {
    getHealthCheck.mockReturnValue(Promise.resolve(new Error('')));

    request(app)
      .get('/health')
      .expect(500)
      .expect(() => {
        expect(updateLogEvent).toHaveBeenCalledTimes(1);
        expect(updateLogEventWithError).toHaveBeenCalledTimes(1);
      })
      .end(done);
  });

  it('should update the log event for any unexpected error', done => {
    getHealthCheck.mockReturnValue(Promise.resolve(expectedHealthCheckBase(false)));

    request(app)
      .get('/health')
      .expect(() => {
        expect(updateLogEvent).toHaveBeenCalledTimes(2);
        expect(updateLogEvent).toHaveBeenCalledWith({ status: 'Health check completed' });
        expect(updateLogEvent).toHaveBeenCalledWith(expectedHealthCheckBase(false));
      })
      .end(done);
  });
});

function mockExpressWinston() {
  return {
    errorLogger: () => (req, res, next) => next(),
    logger: () => (req, res, next) => next()
  };
}

const expectedS3Base = (isWritable, isConnected) => {
  const s3Base = {
    available: isConnected,
    writable: isWritable
  };
  return !isWritable
    ? {
        ...s3Base,
        error: mockErrorResponse
      }
    : s3Base;
};

const expectedHealthCheckBase = (
  s3_writable = true,
  s3_connected = true,
  db_writable = true,
  db_connected = true
) => ({
  details: {
    filestore: expectedS3Base(s3_writable, s3_connected),
    database: getExpectedDatabase(db_writable, db_connected)
  }
});

const getExpectedDatabase = (isWritable, isConnected) => {
  const baseConf = {
    connection: isConnected,
    writable: isWritable
  };

  return !isWritable
    ? {
        ...baseConf,
        error: mockErrorResponse
      }
    : baseConf;
};

function mockLoggingMiddleware() {
  const original = jest.requireActual('../middleware/logging');
  return {
    ...original,
    updateLogEvent: jest.fn(),
    updateLogEventWithError: jest.fn()
  };
}
