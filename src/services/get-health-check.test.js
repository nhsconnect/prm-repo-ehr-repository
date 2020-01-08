import getHealthCheck from './get-health-check';
import { S3 } from 'aws-sdk';
import ModelFactory from '../database/models';
import config from '../config';

jest.mock('aws-sdk');

describe('getHealthCheck', () => {
  beforeEach(() => {
    ModelFactory._resetConfig();
    S3.mockImplementation(() => ({
      putObject: jest.fn().mockImplementation((config, callback) => callback())
    }));
  });

  afterAll(() => {
    ModelFactory.sequelize.close();
  });

  it('should return successful s3 health check if s3 succeeds', () => {
    return getHealthCheck().then(result => {
      const s3 = result.details.filestore;
      expect(s3).toEqual({
        type: 's3',
        bucketName: config.awsS3BucketName,
        available: true,
        writable: true
      });
    });
  });

  it('should return failed s3 health check if s3 returns an error', () => {
    S3.mockImplementation(() => ({
      putObject: jest.fn().mockImplementation((config, callback) => callback('some s3 error'))
    }));

    return getHealthCheck().then(result => {
      const s3 = result.details.filestore;

      return expect(s3).toEqual({
        type: 's3',
        bucketName: config.awsS3BucketName,
        available: true,
        writable: false,
        error: 'some s3 error'
      });
    });
  });

  it('should return successful db health check if db connection is healthy', () => {
    return getHealthCheck().then(result => {
      const db = result.details['database'];
      return expect(db).toEqual({
        type: 'postgresql',
        connection: true,
        writable: true
      });
    });
  });

  it('should return failed db health check if username is incorrect', () => {
    ModelFactory._overrideConfig('username', 'wrong-username');

    return getHealthCheck().then(result => {
      const db = result.details['database'];

      return expect(db).toEqual({
        type: 'postgresql',
        connection: true,
        writable: false,
        error: 'Authorization error (Error Code: 28P01)'
      });
    });
  });

  it('should return failed db health check if there is an unknown error', () => {
    ModelFactory._overrideConfig('host', 'something');

    return getHealthCheck().then(result => {
      const db = result.details['database'];

      return expect(db).toEqual({
        type: 'postgresql',
        connection: false,
        writable: false,
        error: 'Unknown error (Error Code: ENOTFOUND)'
      });
    });
  });
});
