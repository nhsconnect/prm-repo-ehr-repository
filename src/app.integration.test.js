import request from 'supertest';
import uuid from 'uuid/v4';
import app from './app';
import getSignedUrl from './services/get-signed-url';

jest.mock('aws-sdk');
jest.mock('./config/logging');
jest.mock('express-winston', () => ({
  errorLogger: () => (req, res, next) => next(),
  logger: () => (req, res, next) => next()
}));

describe('POST /health-record', () => {
  describe('when running locally', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'local';
    });

    it('should return fake url', done => {
      const conversationId = uuid();
      const messageId = uuid();

      request(app)
        .post(`/health-record/${conversationId}/message`)
        .send({
          messageId
        })
        .end(() => {
          getSignedUrl(conversationId, messageId).then(url => {
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
