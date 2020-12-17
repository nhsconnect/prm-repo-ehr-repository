import { S3 } from 'aws-sdk';
import config from '../../../config';
import S3Service from '../s3';

jest.mock('dayjs', () => () => ({ format: () => '2020-03-11 10:50:56' }));
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

      return new S3Service('some-filename').getPresignedUrl('putObject').then(url => {
        expect(url).toEqual('some-presigned-url');
        expect(mockSignedUrl).toHaveBeenCalledWith('putObject', parameters);
      });
    });

    it('should call s3 getSignedUrl with parameters', () => {
      const mockSignedUrl = jest.fn().mockResolvedValue('some-presigned-url');

      S3.mockImplementation(() => ({
        getSignedUrlPromise: mockSignedUrl
      }));

      const parameters = {
        Bucket: config.awsS3BucketName,
        Key: 'some-filename',
        Expires: 60
      };

      return new S3Service('some-filename').getPresignedUrl('getObject').then(url => {
        expect(url).toEqual('some-presigned-url');
        expect(mockSignedUrl).toHaveBeenCalledWith('getObject', parameters);
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
