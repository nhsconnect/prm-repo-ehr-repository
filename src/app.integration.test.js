import request from "supertest";
import uuid from 'uuid/v4';
import {Client} from 'pg';
import config from "./config";
import app from "./app";
import {S3} from "aws-sdk";
import getSignedUrl from "./services/get-signed-url";

jest.mock('aws-sdk');

const client = new Client({
    user: config.databaseUser,
    password: config.databasePassword,
    database: config.databaseName,
    host: config.databaseHost
});

describe('POST /url', () => {
    beforeAll(() => client.connect());
    afterAll(() => client.end());

    describe('when running locally', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'local';
        });

        afterEach(() => client.query('DELETE FROM ehr'));

        it('should return fake url', done => {
            const registrationId = uuid();
            const conversationId = uuid();

            request(app)
                .post('/url')
                .send({conversationId: conversationId})
                .end(() => {
                  getSignedUrl(conversationId).then(url=>{
                    expect(url).toBe('http://example.com');
                  });
                  done();
                });
        });
    });

    // describe('when running in production mode', () => {
    //   beforeEach(() => {
    //     process.env.NODE_ENV = 'prod';
    //   });
    //
    //   afterEach(() => client.query('DELETE FROM ehr'));
    //
    //   const mockSignedUrl = jest.fn().mockImplementation(()=>{
    //     return Promise.resolve('url')
    //   });
    //
    //   S3.mockImplementation(() => ({
    //     getSignedUrl: mockSignedUrl
    //   }));
    //
    //   it('should update database with nhs number and file path', done => {
    //       const nhsNumber = uuid();
    //
    //       request(app)
    //           .post('/url')
    //           .send({nhsNumber: nhsNumber, ehr: 'some-data'})
    //           .end(() => {
    //               client.query('SELECT * FROM ehr')
    //                   .then(res => {
    //                       expect(res.rowCount).toEqual(1);
    //                       const ehr = res.rows[0];
    //                       expect(ehr.nhs_number).toEqual(nhsNumber);
    //                       expect(ehr.s3_key).toContain(nhsNumber);
    //                       done()
    //                   })
    //           })
    //     });
    // });
});
