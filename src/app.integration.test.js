import request from "supertest";
import {promises as fsPromises} from "fs";
import uuid from 'uuid/v4';
import {Client} from 'pg';
import config from "./config";
import app from "./app";
import {S3} from "aws-sdk";

jest.mock('aws-sdk');

const client = new Client({
    user: config.databaseUser,
    password: config.databasePassword,
    database: config.databaseName
});

describe('POST /ehr', () => {
    beforeAll(() => client.connect());
    afterAll(() => client.end());

    describe('when running locally', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'local';
        });

        afterEach(() => client.query('DELETE FROM ehr'));

        it('should save ehr from request body to local file storage', done => {
            const nhsNumber = uuid();

            request(app)
                .post('/ehr')
                .send({nhsNumber: nhsNumber, ehr: 'some-data'})
                .end(() => {
                    fsPromises.readdir(`./local-datastore/${nhsNumber}`)
                        .then(fileNames => fsPromises.readFile(`./local-datastore/${nhsNumber}/${fileNames.shift()}`, 'utf8'))
                        .then(fileContents => {
                            expect(fileContents).toEqual('some-data');
                            done()
                        });
                });
        });
    });

    describe('when running in production mode', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'prod';
        });

        afterEach(() => client.query('DELETE FROM ehr'));

        const mockPutObject = jest.fn().mockImplementation((config, callback) => callback());
        S3.mockImplementation(() => ({
            putObject: mockPutObject
        }));

        it('should upload ehr to s3', done => {
            const nhsNumber = uuid();

            request(app)
                .post('/ehr')
                .send({nhsNumber: nhsNumber, ehr: 'some-data'})
                .end(() => {
                    expect(mockPutObject).toHaveBeenCalled();
                    expect(mockPutObject.mock.calls[0][0].Body).toEqual('some-data');
                    expect(mockPutObject.mock.calls[0][0].Key).toContain(nhsNumber);
                    done()
                })
        });

        it('should update database with nhs number and file path', done => {
            const nhsNumber = uuid();

            request(app)
                .post('/ehr')
                .send({nhsNumber: nhsNumber, ehr: 'some-data'})
                .end(() => {
                    client.query('SELECT * FROM ehr')
                        .then(res => {
                            expect(res.rowCount).toEqual(1);
                            const ehr = res.rows[0];
                            expect(ehr.nhs_number).toEqual(nhsNumber);
                            expect(ehr.s3_key).toContain(nhsNumber);
                            done()
                        })
                })
        });
    });
});
