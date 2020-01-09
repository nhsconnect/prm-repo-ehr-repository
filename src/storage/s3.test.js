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
    it('should call s3 putObject with parameters ', () => {
      const mockPutObject = jest.fn().mockImplementation((config, callback) => callback());

      S3.mockImplementation(() => ({
        putObject: mockPutObject
      }));

      const parameters = {
        Bucket: config.awsS3BucketName,
        Key: 'some-filename',
        Body: 'some-date'
      };

      return new S3Service('some-filename').checkS3Health().then(result => {
        expect(result).toEqual({
          type: 's3',
          bucketName: config.awsS3BucketName,
          available: true,
          writable: true
        });
        expect(mockPutObject).toHaveBeenCalledWith(parameters, expect.anything());
      });
    });
  });
});
