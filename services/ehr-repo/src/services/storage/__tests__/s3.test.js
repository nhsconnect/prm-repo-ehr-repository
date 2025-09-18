import { S3 } from 'aws-sdk';
import { initializeConfig } from '../../../config';
import S3Service from '../s3';

jest.mock('dayjs', () => () => ({ format: () => '2020-03-11 10:50:56' }));
jest.mock('aws-sdk');

describe('S3Service', () => {
  const config = initializeConfig();

  describe('checkS3Health', () => {
    const error = 'some-error';
    const mockPutObjectPromise = jest.fn();

    const mockPutObject = jest.fn().mockImplementation(() => ({ promise: mockPutObjectPromise }));
    const mockHeadBucket = jest.fn().mockImplementation((_config, callback) => callback());

    const expectedResultBase = {
      type: 's3',
      bucketName: config.awsS3BucketName,
      available: false,
      writable: false
    };

    beforeEach(() => {
      S3.mockImplementation(() => ({
        putObject: mockPutObject,
        headBucket: mockHeadBucket
      }));
    });

    it('should return writable true if you can save to S3', () => {
      mockPutObjectPromise.mockReturnValueOnce(Promise.resolve());

      return new S3Service().checkS3Health().then((result) => {
        expect(result).toStrictEqual({
          ...expectedResultBase,
          available: true,
          writable: true
        });
      });
    });

    it('should return writable false if you can not save to S3', () => {
      mockPutObjectPromise.mockReturnValueOnce(Promise.reject(error));

      return new S3Service().checkS3Health().then((result) => {
        expect(result).toStrictEqual({
          ...expectedResultBase,
          error: error,
          available: true
        });
      });
    });

    it('should return writable and accessible false if you can not connect to S3', () => {
      mockHeadBucket.mockImplementation((config, callback) => callback(error));

      return new S3Service().checkS3Health().then((result) => {
        expect(result).toStrictEqual({
          ...expectedResultBase,
          error: 'some-error'
        });
      });
    });
  });
});
