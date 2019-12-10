import {S3} from "aws-sdk";
import getUrl from "./s3";
import config from "../config";

jest.mock('uuid/v4', () => jest.fn().mockReturnValue('some-uuid'));
jest.mock('aws-sdk');

describe('getUrl', () => {
    it('should call s3 putObject with parameters', () => {
        const mockSignedUrl = jest.fn().mockImplementation(()=>{
          return Promise.resolve('url')
        });
        S3.mockImplementation(() => ({
          getSignedUrl: mockSignedUrl
        }));
        const callback = jest.fn();
        const parameters = {
          Bucket: config.awsS3BucketName,
          Key: 'key',
          Expires: 60,
          ContentType: 'text/xml',
          ACL: 'public-read'
        };
        getUrl('key').then(()=>{
          expect(mockSignedUrl).toHaveBeenCalledWith("putObject", parameters, callback);
        })


    });
});
