import s3Save from "./s3";
import fileSystemSave from "./file-system";
import upload from "./upload";

jest.mock('./s3', () => jest.fn().mockReturnValue(Promise.resolve()));
jest.mock('./file-system', () => jest.fn().mockReturnValue(Promise.resolve()));

describe('upload', () => {
    it('should upload to s3 if not running locally', () => {
        process.env.NODE_ENV = 'prod';

        return upload('some-data')
            .then(() => {
                expect(s3Save).toHaveBeenCalledWith('some-data')
            });
    });

    it('should upload to local file system if running locally', () => {
        process.env.NODE_ENV = 'local';

        return upload('some-data')
            .then(() => {
                expect(fileSystemSave).toHaveBeenCalledWith('some-data')
            });
    });
});