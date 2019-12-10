import getUrl from "../storage/s3";
import getSignedUrl from "./get-signed-url";

jest.mock('../storage/s3', () => jest.fn().mockReturnValue(Promise.resolve()));
jest.mock('uuid/v4', () => jest.fn().mockReturnValue('some-uuid'));

describe('get-signed-url', () => {
  describe('getUploadUrl', () => {
    it('should call the s3 to get pre-signed url to put object', () => {
      process.env.NODE_ENV = 'prod';

      return getSignedUrl('conversation-id').then(() => {
          expect(getUrl).toHaveBeenCalledWith(`conversation-id/some-uuid`)
        });
    })
  });
});