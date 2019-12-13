import getUrl from '../storage/s3';
import getSignedUrl from './get-signed-url';
import {S3} from "aws-sdk";


jest.mock('aws-sdk');
jest.mock('uuid/v4', () => jest.fn().mockReturnValue('some-uuid'));



describe('get-signed-url', () => {
  const conversationId= 'some-id'
  describe('getUploadUrl', () => {
    process.env.NODE_ENV = 'local'

    const mockSignedUrl = jest.fn().mockImplementation((operation, params, callback) => callback('some-error'));
    S3.mockImplementation(() => ({
      getSignedUrl: mockSignedUrl
    }));


    it('should return promise with fake respond if run locally', () => {
      return expect(getSignedUrl(conversationId)).resolves.toBe('http://example.com')
    });

    it('should get reject with error from s3 if run in production mode', () => {
      process.env.NODE_ENV = 'prod';

        return expect(getSignedUrl(conversationId)).rejects.toBe('some-error');
    })
  });
});
