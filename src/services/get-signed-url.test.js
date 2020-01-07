import getSignedUrl from './get-signed-url';
import { S3 } from 'aws-sdk';

jest.mock('aws-sdk');
jest.mock('uuid/v4', () => jest.fn().mockReturnValue('some-uuid'));

describe('get-signed-url', () => {
  const conversationId = 'some-id';
  const messageId = 'some-message';

  describe('getUploadUrl', () => {
    const mockSignedUrl = jest.fn().mockImplementation((operation, params, callback) => callback());

    let node_env;

    beforeAll(() => {
      S3.mockImplementation(() => ({
        getSignedUrl: mockSignedUrl
      }));
      node_env = process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env.NODE_ENV = node_env;
    });

    it('should return promise with fake respond if run locally', () => {
      return getSignedUrl(conversationId, messageId).then(() => {
        return expect(mockSignedUrl).toBeCalledWith(
          'putObject',
          {
            Bucket: 'test-bucket',
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
