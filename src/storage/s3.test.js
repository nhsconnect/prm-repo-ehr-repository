import {S3} from "aws-sdk";
import getUrl from "./s3";
import config from "../config";

jest.mock('uuid/v4', () => jest.fn().mockReturnValue('some-uuid'));
jest.mock('aws-sdk');

describe('getUrl', () => {
    it('should call s3 putObject with parameters', () => {
        const mockSignedUrl = jest.fn().mockImplementation((operation, parameters, callback) => callback());
        S3.mockImplementation(() => ({
          getSignedUrl: mockSignedUrl
        }));

        return getUrl('key')
            .then(() => {
                const parameters = {
                    Bucket: config.awsS3BucketName,
                    Key: 'key',
                    Expires: 60,
                    ContentType: 'text/xml',
                    ACL: 'public-read'
                };
                expect(mockSignedUrl).toHaveBeenCalledWith("putObject", parameters, expect.anything())
            })
    });
});
