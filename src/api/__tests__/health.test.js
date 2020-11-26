import app from '../../app';
import request from 'supertest';
import { getHealthCheck } from '../../services/get-health-check';
import { logEvent, logError } from '../../middleware/logging';

jest.mock('../../config/logging');
jest.mock('../../services/get-health-check');
jest.mock('../../middleware/logging');

const mockErrorResponse = 'some-error';

describe('GET /health', () => {
  describe('all dependencies are available', () => {
    beforeEach(() => {
      getHealthCheck.mockReturnValue(Promise.resolve(expectedHealthCheckBase()));
    });

    it('should return HTTP status code 200', done => {
      request(app)
        .get('/health')
        .expect(200)
        .end(done);
    });

    it('should return details of the response from getHealthCheck', done => {
      request(app)
        .get('/health')
        .expect(res => {
          expect(res.body).toEqual(expectedHealthCheckBase());
        })
        .end(done);
    });

    it('should call health check service with no parameters', done => {
      request(app)
        .get('/health')
        .expect(() => {
          expect(getHealthCheck).toHaveBeenCalledTimes(1);
        })
        .end(done);
    });

    it('should call logEvent with result when all dependencies are ok', done => {
      request(app)
        .get('/health')
        .expect(() => {
          expect(logEvent).toHaveBeenCalledWith('Health check successful');
        })
        .end(done);
    });
  });

  describe('S3 is not writable', () => {
    beforeEach(() => {
      getHealthCheck.mockReturnValue(Promise.resolve(expectedHealthCheckBase(false)));
    });

    it('should return 503 status if s3 writable is false', done => {
      request(app)
        .get('/health')
        .expect(503)
        .end(done);
    });

    it('should return details of the response from getHealthCheck when s3 writable is false', done => {
      request(app)
        .get('/health')
        .expect(res => {
          expect(res.body).toEqual(expectedHealthCheckBase(false));
        })
        .end(done);
    });

    it('should call logError with the health check result if s3 writable is false', done => {
      request(app)
        .get('/health')
        .expect(() => {
          expect(logError).toHaveBeenCalledWith(
            'Health check failed',
            expectedHealthCheckBase(false)
          );
        })
        .end(done);
    });
  });

  describe('database is not writable', () => {
    beforeEach(() => {
      getHealthCheck.mockReturnValue(Promise.resolve(expectedHealthCheckBase(true, true, false)));
    });

    it('should return 503 status if db writable is false', done => {
      request(app)
        .get('/health')
        .expect(503)
        .end(done);
    });

    it('should return details of the response from getHealthCheck when the database writable is false', done => {
      request(app)
        .get('/health')
        .expect(res => {
          expect(res.body).toEqual(expectedHealthCheckBase(true, true, false));
        })
        .end(done);
    });

    it('should call logError with the health check result if db writable is false', done => {
      request(app)
        .get('/health')
        .expect(() => {
          expect(logError).toHaveBeenCalledWith(
            'Health check failed',
            expectedHealthCheckBase(true, true, false)
          );
        })
        .end(done);
    });
  });

  describe('s3 is not available', () => {
    beforeEach(() => {
      getHealthCheck.mockReturnValue(Promise.resolve(expectedHealthCheckBase(true, false)));
    });

    it('should return 503 status if s3 available is false', done => {
      request(app)
        .get('/health')
        .expect(503)
        .end(done);
    });

    it('should return details of the response from getHealthCheck when the s3 available is false', done => {
      request(app)
        .get('/health')
        .expect(res => {
          expect(res.body).toEqual(expectedHealthCheckBase(true, false));
        })
        .end(done);
    });

    it('should call logError with the health check result if s3 available is false', done => {
      request(app)
        .get('/health')
        .expect(() => {
          expect(logError).toHaveBeenCalledWith(
            'Health check failed',
            expectedHealthCheckBase(true, false)
          );
        })
        .end(done);
    });
  });

  describe('s3 and database are not available', () => {
    beforeEach(() => {
      getHealthCheck.mockReturnValue(
        Promise.resolve(expectedHealthCheckBase(false, false, false, false))
      );
    });

    it('should return 503 if both s3 and db are not writable', done => {
      request(app)
        .get('/health')
        .expect(503)
        .end(done);
    });

    it('should call logError with the health check result if both s3 and db are not writable', done => {
      request(app)
        .get('/health')
        .expect(() => {
          expect(logError).toHaveBeenCalledWith(
            'Health check failed',
            expectedHealthCheckBase(false, false, false, false)
          );
        })
        .end(done);
    });
  });

  describe('getHealthCheck throws error', () => {
    beforeEach(() => {
      getHealthCheck.mockRejectedValue(Error('some-error'));
    });

    it('should return 500 if getHealthCheck if it cannot provide a health check', done => {
      request(app)
        .get('/health')
        .expect(500)
        .end(done);
    });

    it('should logError if getHealthCheck throws an error', done => {
      request(app)
        .get('/health')
        .expect(() => {
          expect(logError).toHaveBeenCalledTimes(1);
          expect(logError).toHaveBeenCalledWith('Health check error', expect.anything());
        })
        .end(done);
    });

    it('should update the log event for any unexpected error', done => {
      getHealthCheck.mockReturnValue(Promise.resolve(expectedHealthCheckBase(false)));

      request(app)
        .get('/health')
        .expect(() => {
          expect(logError).toHaveBeenCalledTimes(1);
          expect(logError).toHaveBeenCalledWith(
            'Health check failed',
            expectedHealthCheckBase(false)
          );
        })
        .end(done);
    });
  });
});

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
