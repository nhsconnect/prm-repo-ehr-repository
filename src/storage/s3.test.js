import { S3 } from 'aws-sdk';
import S3Service from './s3';
import config from '../config';

jest.mock('moment', () => () => ({ format: () => 'some-date' }));
jest.mock('aws-sdk');

describe('S3Service', () => {
  describe('getPresignedUrl', () => {
    it('should call s3 getSignedUrl with parameters', () => {
      const mockSignedUrl = jest.fn().mockResolvedValue('some-presigned-url');

      S3.mockImplementation(() => ({
        getSignedUrlPromise: mockSignedUrl
      }));

      const parameters = {
        Bucket: config.awsS3BucketName,
        Key: 'some-filename',
        Expires: 60,
        ContentType: 'text/xml'
      };

      return new S3Service('some-filename').getPresignedUrl().then(url => {
        expect(url).toEqual('some-presigned-url');
        expect(mockSignedUrl).toHaveBeenCalledWith('putObject', parameters);
      });
    });
  });

  describe('checkS3Health', () => {
    const error = 'some-error';

    const mockPutObject = jest.fn().mockImplementation((config, callback) => callback());
    const mockHeadBucket = jest.fn().mockImplementation((config, callback) => callback());

    const expectedResultBase = {
      type: 's3',
      bucketName: config.awsS3BucketName,
      available: false,
      writable: false
    };

    beforeEach(() => {
      jest.clearAllMocks();

      S3.mockImplementation(() => ({
        putObject: mockPutObject,
        headBucket: mockHeadBucket
      }));
    });

    it('should return writable true if you can save to S3', () => {
      mockPutObject.mockImplementation((config, callback) => callback());

      return new S3Service('some-filename').checkS3Health().then(result => {
        expect(result).toStrictEqual({
          ...expectedResultBase,
          available: true,
          writable: true
        });
      });
    });

    it('should return writable false if you can not save to S3', () => {
      mockPutObject.mockImplementation((config, callback) => callback(error));

      return new S3Service('some-filename').checkS3Health().then(result => {
        expect(result).toStrictEqual({
          ...expectedResultBase,
          error: 'some-error',
          available: true
        });
      });
    });

    it('should return writable and accessible false if you can not connect to S3', () => {
      mockHeadBucket.mockImplementation((config, callback) => callback(error));

      return new S3Service('some-filename').checkS3Health().then(result => {
        expect(result).toStrictEqual({
          ...expectedResultBase,
          error: 'some-error'
        });
      });
    });
  });
});
