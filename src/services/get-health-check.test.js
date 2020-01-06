import getHealthCheck from './get-health-check';
import { S3 } from 'aws-sdk';
import ModelFactory from '../database/models';

jest.mock('aws-sdk');

const s3MockPutObjectGood = jest.fn().mockImplementation((config, callback) => callback());
const s3MockPutObjectBad = jest
  .fn()
  .mockImplementation((config, callback) => callback('some s3 error'));

describe('getHealthCheck', () => {
  beforeEach(() => {
    ModelFactory._resetConfig();
    S3.mockClear();
  });

  afterAll(() => {
    ModelFactory.sequelize.close();
  });

  describe('prod environment', () => {
    process.env.NODE_ENV = 'prod';

    it('should get reject with error from s3 if run in production mode and s3 returns an error', () => {

      S3.mockImplementation(() => ({
        putObject: s3MockPutObjectBad
      }));

      return getHealthCheck().then(result => {
        const s3 = result.details['file-store'];

        return expect(s3).toEqual({
          type: 's3',
          bucketName: undefined,
          available: true,
          writable: false,
          error: 'some s3 error'
        });
      });
    });

    it('should return true of the db connection if db connection is healthy', () => {
      S3.mockImplementation(() => ({
        putObject: s3MockPutObjectGood
      }));

      ModelFactory._overrideConfig('database', 'something');

      return getHealthCheck().then(result => {
        const db = result.details['database'];

        return expect(db).toEqual({
          type: 'postgresql',
          connection: false,
          writable: false,
          error: 'Connection error (Error Code: 3D000)'
        });
      });
    });

    it('should return connection false if user is wrong', () => {

      S3.mockImplementation(() => ({
        putObject: s3MockPutObjectGood
      }));

      ModelFactory._overrideConfig('username', 'hello');

      return getHealthCheck().then(result => {

        const db = result.details['database'];

        return expect(db).toEqual({
          type: 'postgresql',
          connection: false,
          writable: true,
          error: 'Authorization error (Error Code: 28P01)'
        });
      });
    });
  });
});
