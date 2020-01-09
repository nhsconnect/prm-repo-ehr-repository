import { S3 } from 'aws-sdk';
import S3Service from './s3';
import config from '../config';

jest.mock('moment', () => () => ({ format: () => 'some-date' }));
jest.mock('aws-sdk');

describe('S3Service', () => {
  describe('getUrl', () => {
    it('should call s3 getSignedUrl with parameters', () => {
      const mockSignedUrl = jest
        .fn()
        .mockImplementation((operation, params, callback) => callback());

      S3.mockImplementation(() => ({
        getSignedUrl: mockSignedUrl
      }));

      const parameters = {
        Bucket: config.awsS3BucketName,
        Key: 'key',
        Expires: 60,
        ContentType: 'text/xml'
      };

      return new S3Service('key').getPutSignedUrl().then(() => {
        expect(mockSignedUrl).toHaveBeenCalledWith('putObject', parameters, expect.anything());
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
