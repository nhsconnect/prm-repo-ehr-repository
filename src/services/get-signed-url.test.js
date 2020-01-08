import { S3 } from 'aws-sdk';
import getSignedUrl from './get-signed-url';
import config from '../config';

jest.mock('aws-sdk');

describe('get-signed-url', () => {
  const conversationId = 'some-id';
  const messageId = 'some-message';

  describe('getUploadUrl', () => {
    const mockSignedUrl = jest.fn().mockImplementation((operation, params, callback) => callback());

    beforeAll(() => {
      S3.mockImplementation(() => ({
        getSignedUrl: mockSignedUrl
      }));
    });

    it('should return promise with 200 OK response if run locally', () => {
      return getSignedUrl(conversationId, messageId).then(() => {
        expect(mockSignedUrl).toBeCalledWith(
          'putObject',
          {
            Bucket: config.awsS3BucketName,
            Key: `${conversationId}/${messageId}`,
            Expires: 60,
            ContentType: 'text/xml'
          },
          expect.any(Function)
        );
      });
    });
  });
});
