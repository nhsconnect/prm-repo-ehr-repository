import app from '../app';
import request from 'supertest';
import { getHealthCheck } from '../services/get-health-check';
import { updateLogEvent, updateLogEventWithError } from '../middleware/logging';

jest.mock('../config/logging');
jest.mock('../services/get-health-check');
jest.mock('../middleware/logging', () => mockLoggingMiddleware());
jest.mock('express-winston', () => mockExpressWinston());

describe('GET /health', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and the response from getHealthCheck', done => {
    getHealthCheck.mockReturnValue(Promise.resolve(getHealthCheckResponse()));

    request(app)
      .get('/health')
      .expect(200)
      .expect(res => {
        expect(res.body).toEqual(getHealthCheckResponse());
      })
      .end(done);
  });

  it('should call health check service with no parameters', done => {
    getHealthCheck.mockReturnValue(Promise.resolve(getHealthCheckResponse()));

    request(app)
      .get('/health')
      .expect(() => {
        expect(getHealthCheck).toHaveBeenCalledTimes(1);
      })
      .end(done);
  });

  it('should return 503 status if s3 writable is false', done => {
    getHealthCheck.mockReturnValue(Promise.resolve(getHealthCheckResponse(false)));

    request(app)
      .get('/health')
      .expect(503)
      .expect(() => {
        expect(updateLogEvent).toHaveBeenCalledWith(getHealthCheckResponse(false));
      })
      .end(done);
  });

  it('should return 503 status if db writable is false', done => {
    getHealthCheck.mockReturnValue(Promise.resolve(getHealthCheckResponse(true, false)));

    request(app)
      .get('/health')
      .expect(503)
      .expect(() => {
        expect(updateLogEvent).toHaveBeenCalledWith(getHealthCheckResponse(true, false));
      })
      .end(done);
  });

  it('should return 503 if both s3 and db are not writable', done => {
    getHealthCheck.mockReturnValue(Promise.resolve(getHealthCheckResponse(false, false)));

    request(app)
      .get('/health')
      .expect(503)
      .expect(() => {
        expect(updateLogEvent).toHaveBeenCalledWith(getHealthCheckResponse(false, false));
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
    getHealthCheck.mockReturnValue(Promise.resolve(getHealthCheckResponse(false)));

    request(app)
      .get('/health')
      .expect(() => {
        expect(updateLogEvent).toHaveBeenCalledTimes(2);
        expect(updateLogEvent).toHaveBeenCalledWith({ status: 'Health check completed' });
        expect(updateLogEvent).toHaveBeenCalledWith(getHealthCheckResponse(false));
      })
      .end(done);
  });
});

function getHealthCheckResponse(s3_writable = true, db_writable = true) {
  const getWritableResponse = writable => {
    let retObj = {
      type: 'postgresql',
      connection: true,
      writable: writable
    };

    if (!writable)
      retObj = {
        ...retObj,
        error: 'This is an error message'
      };

    return retObj;
  };

  return {
    version: '1',
    description: 'Health of Electronic Health Record Repository service',
    details: {
      filestore: getWritableResponse(s3_writable),
      database: getWritableResponse(db_writable)
    }
  };
}

function mockExpressWinston() {
  return {
    errorLogger: () => (req, res, next) => next(),
    logger: () => (req, res, next) => next()
  };
}

function mockLoggingMiddleware() {
  const original = jest.requireActual('../middleware/logging');
  return {
    ...original,
    updateLogEvent: jest.fn(),
    updateLogEventWithError: jest.fn()
  };
}
