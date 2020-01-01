import { S3 } from 'aws-sdk';
import { getUrl, save } from './s3';
import config from '../config';

jest.mock('uuid/v4', () => jest.fn().mockReturnValue('some-uuid'));
jest.mock('aws-sdk');

describe('getUrl', () => {
  it('should call s3 getSignedUrl with parameters', () => {
    const mockSignedUrl = jest.fn().mockImplementation((operation, params, callback) => callback());
    S3.mockImplementation(() => ({
      getSignedUrl: mockSignedUrl
    }));

    const parameters = {
      Bucket: config.awsS3BucketName,
      Key: 'key',
      Expires: 60,
      ContentType: 'text/xml'
    };
    return getUrl('key').then(() => {
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
    return save('some-date').then(() => {
      expect(mockPutObject).toHaveBeenCalledWith(parameters, expect.anything());
    });
  });
});
