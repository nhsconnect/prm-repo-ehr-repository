import { S3 } from 'aws-sdk';
import S3Service from './s3';
import config from '../config';

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

  describe('saveHeathCheckToS3', () => {
    it('should call s3 putObject with parameters ', () => {
      const mockPutObject = jest.fn().mockImplementation((config, callback) => callback());

      S3.mockImplementation(() => ({
        putObject: mockPutObject
      }));

      const parameters = {
        Bucket: config.awsS3BucketName,
        Key: 'health-check.txt',
        Body: 'some-date'
      };
      return new S3Service('health-check.txt').save('some-date').then(() => {
        expect(mockPutObject).toHaveBeenCalledWith(parameters, expect.anything());
      });
    });
  });
});
