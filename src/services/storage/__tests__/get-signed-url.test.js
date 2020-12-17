import { S3 } from 'aws-sdk';
import getSignedUrl from '../get-signed-url';

jest.mock('aws-sdk');

describe('getSignedUrl', () => {
  const conversationId = 'some-id';
  const messageId = 'some-message';
  ['getObject', 'putObject'].forEach(operation => {
    it('should return presigned url from s3 for storing ehr', async () => {
      const mockGetSignedUrlPromise = jest.fn().mockResolvedValue('some-url');
      S3.mockImplementation(() => ({
        getSignedUrlPromise: mockGetSignedUrlPromise
      }));

      const url = await getSignedUrl(conversationId, messageId, operation);
      expect(mockGetSignedUrlPromise).toHaveBeenCalledWith(operation, expect.anything());
      expect(url).toEqual('some-url');
    });
  });
});
