import {S3} from "aws-sdk";
import save from "./s3";
import config from "../config";

jest.mock('uuid/v4', () => jest.fn().mockReturnValue('some-uuid'));
jest.mock('aws-sdk');

describe('save', () => {
    it('should call s3 putObject with parameters', () => {
        const mockPutObject = jest.fn().mockImplementation((config, callback) => callback());
        S3.mockImplementation(() => ({
            putObject: mockPutObject
        }));

        return save('some-data', 'some-nhs-number')
            .then(() => {
                const parameters = {
                    Bucket: config.awsS3BucketName,
                    Key: 'some-nhs-number/some-uuid',
                    Body: 'some-data'
                };
                expect(mockPutObject).toHaveBeenCalledWith(parameters, expect.anything())
            })
    });

    it('should return the s3 key', () => {
        return save('some-data', 'some-nhs-number')
            .then(key => {
                expect(key).toEqual('some-nhs-number/some-uuid')
            })
    });
});
