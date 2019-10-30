import s3Save from "../storage/s3";
import fileSystemSave from "../storage/file-system";
import upload from "./upload";
import dbSave from "../storage/db";

jest.mock('../storage/s3', () => jest.fn().mockReturnValue(Promise.resolve()));
jest.mock('../storage/file-system', () => jest.fn().mockReturnValue(Promise.resolve()));
jest.mock('../storage/db', () => jest.fn().mockReturnValue(Promise.resolve()));

describe('upload', () => {
    it('should upload to s3 if not running locally', () => {
        process.env.NODE_ENV = 'prod';

        return upload('some-data', 'some-nhs-number')
            .then(() => {
                expect(s3Save).toHaveBeenCalledWith('some-data', 'some-nhs-number')
            });
    });

    it('should save deduction metadata to the db with s3 storage location', () => {
        process.env.NODE_ENV = 'prod';
        s3Save.mockResolvedValue('some-key');

        return upload('some-data', 'some-nhs-number')
            .then(() => {
                expect(dbSave).toHaveBeenCalledWith('some-nhs-number', 'some-key')
            });
    });

    it('should upload to local file system if running locally', () => {
        process.env.NODE_ENV = 'local';

        return upload('some-data', 'some-nhs-number')
            .then(() => {
                expect(fileSystemSave).toHaveBeenCalledWith('some-data', 'some-nhs-number')
            });
    });

    it('should save deduction metadata to the db with local storage location', () => {
        process.env.NODE_ENV = 'local';
        fileSystemSave.mockResolvedValue('some-file-path');

        return upload('some-data', 'some-nhs-number')
            .then(() => {
                expect(dbSave).toHaveBeenCalledWith('some-nhs-number', 'some-file-path')
            });
    });
});