import { getHealthCheck } from '../get-health-check';
import { S3 } from 'aws-sdk';
import ModelFactory from '../../../models';
import { initializeConfig } from '../../../config';

jest.mock('aws-sdk');

describe('getHealthCheck', () => {
  const config = initializeConfig();
  const mockHeadBucket = jest.fn().mockImplementation((config, callback) => callback());
  const mockPutObjectPromise = jest.fn();
  const mockPutObject = jest.fn().mockImplementation(() => ({ promise: mockPutObjectPromise }));
  const error = 'some-error';

  beforeEach(() => {
    ModelFactory._resetConfig();

    S3.mockImplementation(() => ({
      putObject: mockPutObject,
      headBucket: mockHeadBucket,
    }));
  });

  afterAll(() => {
    ModelFactory.sequelize.close();
  });

  it('should return successful s3 health check if s3 succeeds', () => {
    // when
    mockPutObjectPromise.mockReturnValueOnce(Promise.resolve());
    return getHealthCheck().then((result) => {
      const s3 = result.details.filestore;
      // then
      expect(s3).toEqual({
        type: 's3',
        bucketName: config.awsS3BucketName,
        available: true,
        writable: true,
      });
    });
  });

  it('should return failed s3 health check if s3 returns an error', () => {
    // when
    mockPutObjectPromise.mockRejectedValue(error);
    return getHealthCheck().then((result) => {
      const s3 = result.details.filestore;
      // then
      return expect(s3).toEqual({
        type: 's3',
        bucketName: config.awsS3BucketName,
        available: true,
        writable: false,
        error: error,
      });
    });
  });

  it('should return available false if s3 can be connected ', () => {
    mockHeadBucket.mockImplementation((config, callback) => callback(error));

    return getHealthCheck().then((result) => {
      const s3 = result.details.filestore;

      return expect(s3).toEqual({
        type: 's3',
        bucketName: config.awsS3BucketName,
        available: false,
        writable: false,
        error: error,
      });
    });
  });

  it('should return failed db health check if there is an unknown error', () => {
    ModelFactory._overrideConfig('host', 'something');

    return getHealthCheck().then((result) => {
      const db = result.details['database'];

      return expect(db).toEqual({
        type: 'postgresql',
        connection: false,
        writable: false,
        error: 'Unknown error (Error Code: ENOTFOUND)',
      });
    });
  });
});
