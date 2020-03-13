import { S3 } from 'aws-sdk';
import getSignedUrl from '../get-signed-url';

jest.mock('aws-sdk');

describe('getSignedUrl', () => {
  const conversationId = 'some-id';
  const messageId = 'some-message';

  it('should return presigned url from s3', () => {
    S3.mockImplementation(() => ({
      getSignedUrlPromise: jest.fn().mockResolvedValue('some-url')
    }));

    return getSignedUrl(conversationId, messageId).then(url => {
      expect(url).toEqual('some-url');
    });
  });
});
