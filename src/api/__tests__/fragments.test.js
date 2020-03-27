import request from 'supertest';
import app from '../../app';
import ModelFactory from '../../models';
import { persistHealthRecord } from '../../services/database';
import { getSignedUrl } from '../../services/storage';

jest.mock('../../middleware/logging');
jest.mock('../../middleware/auth');
jest.mock('../../services/database/persist-health-record', () => ({
  persistHealthRecord: jest.fn().mockReturnValue(Promise.resolve('Persisted'))
}));

jest.mock('../../services/storage/get-signed-url', () =>
  jest.fn().mockReturnValue(Promise.resolve('some-url'))
);

describe('fragments', () => {
  const nhsNumber = '0123456789';
  const conversationId = 'db4b773d-f171-4a5f-a23b-6a387f8792b7';
  const messageId = '0809570a-3ae2-409c-a924-60766b39550f';
  const manifest = ['0809570a-3ae2-409c-a924-60766b39550f', '88148835-2708-4914-a1d2-39c84560a937'];
  const testEndpoint = `/fragments`;

  afterAll(() => {
    ModelFactory.sequelize.close();
  });

  describe('POST /fragments', () => {
    describe('Success', () => {
      it('should return 201', done => {
        request(app)
          .post(testEndpoint)
          .send({
            messageId,
            conversationId
          })
          .expect(201)
          .end(done);
      });

      it('should call getSignedUrl service with request body', done => {
        request(app)
          .post(testEndpoint)
          .send({
            messageId,
            conversationId
          })
          .expect(() => {
            expect(getSignedUrl).toHaveBeenCalledWith(conversationId, messageId);
          })
          .end(done);
      });

      it('should return URL from s3 service', done => {
        request(app)
          .post(testEndpoint)
          .send({
            messageId,
            conversationId
          })
          .expect(res => {
            expect(res.text).toEqual('some-url');
          })
          .end(done);
      });
    });

    describe('validation for the messageId', () => {
      it('should return 422 if no messageId is provided in request body', done => {
        request(app)
          .post(testEndpoint)
          .send()
          .expect(422)
          .end(done);
      });

      it('should return Content-Type as json when no messageId is provided in request body', done => {
        request(app)
          .post(testEndpoint)
          .send()
          .expect('Content-Type', /json/)
          .end(done);
      });

      it('should return error message if no messageId is provided in request body', done => {
        request(app)
          .post(testEndpoint)
          .send()
          .expect(res => {
            expect(res.body).toEqual({
              errors: expect.arrayContaining([{ messageId: "'messageId' is a required field" }])
            });
          })
          .end(done);
      });
    });
  });

  describe('POST /fragments', () => {
    describe('success', () => {
      it('should return 201', done => {
        request(app)
          .post(testEndpoint)
          .send({
            nhsNumber,
            messageId,
            conversationId
          })
          .expect(201)
          .end(done);
      });

      it('should call persistHealthRecord with information provided', done => {
        request(app)
          .post(testEndpoint)
          .send({
            nhsNumber,
            messageId,
            conversationId
          })
          .expect(() => {
            expect(persistHealthRecord).toHaveBeenCalledTimes(1);
            expect(persistHealthRecord).toHaveBeenCalledWith(
              nhsNumber,
              conversationId,
              messageId,
              null
            );
          })
          .end(done);
      });

      it('should call persistHealthRecord with information provided including manifest', done => {
        request(app)
          .post(testEndpoint)
          .send({
            nhsNumber,
            messageId,
            conversationId,
            manifest
          })
          .expect(() => {
            expect(persistHealthRecord).toHaveBeenCalledTimes(1);
            expect(persistHealthRecord).toHaveBeenCalledWith(
              nhsNumber,
              conversationId,
              messageId,
              manifest
            );
          })
          .end(done);
      });

      it('should call getSignedUrl service with request body', done => {
        request(app)
          .post(testEndpoint)
          .send({
            nhsNumber,
            messageId,
            conversationId
          })
          .expect(() => {
            expect(getSignedUrl).toHaveBeenCalledWith(conversationId, messageId);
          })
          .end(done);
      });

      it('should return URL from s3 service', done => {
        request(app)
          .post(testEndpoint)
          .send({
            nhsNumber,
            messageId,
            conversationId
          })
          .expect(res => {
            expect(res.text).toEqual('some-url');
          })
          .end(done);
      });
    });

    describe('validation for messageId', () => {
      it('should return 422 if no messageId is provided in request body', done => {
        request(app)
          .post(testEndpoint)
          .send()
          .expect(422)
          .end(done);
      });

      it('should return with Content-Type as json', done => {
        request(app)
          .post(testEndpoint)
          .send()
          .expect('Content-Type', /json/)
          .end(done);
      });

      it('should respond with error message if messageId is not a UUID', done => {
        request(app)
          .post(testEndpoint)
          .send()
          .expect(res => {
            expect(res.body).toEqual({
              errors: expect.arrayContaining([
                { messageId: "'messageId' provided is not of type UUIDv4" }
              ])
            });
          })
          .end(done);
      });

      it('should respond with error message if messageId is not defined', done => {
        request(app)
          .post(testEndpoint)
          .send()
          .expect(res => {
            expect(res.body).toEqual({
              errors: expect.arrayContaining([{ messageId: "'messageId' is a required field" }])
            });
          })
          .end(done);
      });
    });

    describe('validation for NHS Number', () => {
      it('should return 422 if nhsNumber is defined but not numeric', done => {
        request(app)
          .post(testEndpoint)
          .send({
            nhsNumber: 'abcdefghij',
            messageId,
            manifest,
            conversationId
          })
          .expect(422)
          .end(done);
      });

      it('should return an error when the NHS Number is not numeric', done => {
        request(app)
          .post(testEndpoint)
          .send({
            nhsNumber: 'abcdefghij',
            messageId,
            conversationId,
            manifest
          })
          .expect(res => {
            expect(res.body).toEqual({
              errors: expect.arrayContaining([{ nhsNumber: "'nhsNumber' provided is not numeric" }])
            });
          })
          .end(done);
      });

      it('should return an error when the NHS Number is not 10 characters', done => {
        request(app)
          .post(testEndpoint)
          .send({
            nhsNumber: '123456789',
            messageId,
            conversationId,
            manifest
          })
          .expect(res => {
            expect(res.body).toEqual({
              errors: expect.arrayContaining([
                { nhsNumber: "'nhsNumber' provided is not 10 characters" }
              ])
            });
          })
          .end(done);
      });
    });

    describe('validation from conversationId', () => {
      it('should return 422 when the conversationId is not UUID', done => {
        request(app)
          .post(testEndpoint)
          .send({
            nhsNumber,
            messageId,
            conversationId: '123',
            manifest
          })
          .expect(422)
          .end(done);
      });

      it('should throw an error when the conversationId is not UUID', done => {
        request(app)
          .post(testEndpoint)
          .send({
            nhsNumber,
            messageId,
            conversationId: '123',
            manifest
          })
          .expect(res => {
            expect(res.body).toEqual({
              errors: expect.arrayContaining([
                { conversationId: "'conversationId' provided is not of type UUIDv4" }
              ])
            });
          })
          .end(done);
      });
    });

    describe('validation for manifest', () => {
      it('should return 422 when the manifest is not an array', done => {
        request(app)
          .post(testEndpoint)
          .send({
            nhsNumber,
            messageId,
            conversationId,
            manifest: 'manifest'
          })
          .expect(422)
          .end(done);
      });

      it('should return error message when the manifest is not an array', done => {
        request(app)
          .post(testEndpoint)
          .send({
            nhsNumber,
            messageId,
            conversationId,
            manifest: 'manifest'
          })
          .expect(res => {
            expect(res.body).toEqual({
              errors: expect.arrayContaining([
                { manifest: "'manifest' provided is not of type Array" }
              ])
            });
          })
          .end(done);
      });
    });
  });

  describe('PATCH /fragments', () => {
    const testEndpoint = `/fragments`;

    describe('success', () => {
      it('should return 204', done => {
        request(app)
          .patch(testEndpoint)
          .send({
            transferComplete: true
          })
          .expect(204)
          .end(done);
      });
    });

    describe('validation for tranferComplete', () => {
      it('should return 422 if transferComplete is not provided in body', done => {
        request(app)
          .patch(testEndpoint)
          .send()
          .expect(422)
          .end(done);
      });

      it('should return error message if transferComplete is not provided in body', done => {
        request(app)
          .patch(testEndpoint)
          .send()
          .expect(res => {
            expect(res.body).toEqual({
              errors: expect.arrayContaining([{ transferComplete: 'Invalid value' }])
            });
          })
          .end(done);
      });
    });
  });
});
