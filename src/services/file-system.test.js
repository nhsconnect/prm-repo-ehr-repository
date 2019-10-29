import {promises as fsPromises} from 'fs';
import save from "./file-system";

jest.mock('uuid/v4', () => jest.fn().mockReturnValue('some-uuid'));

describe('save', () => {
    it('should store the data in the local-datastore folder', () => {
        return save('some-data', 'some-nhs-number')
            .then(() => fsPromises.readFile('./local-datastore/some-nhs-number/some-uuid', 'utf8'))
            .then(fileContents => {
                expect(fileContents).toEqual('some-data');
            })
    });

    it('should return the path to the file', () => {
        return save('some-data', 'some-nhs-number')
            .then(filePath => {
                expect(filePath).toEqual('./local-datastore/some-nhs-number/some-uuid')
            })
    });
});