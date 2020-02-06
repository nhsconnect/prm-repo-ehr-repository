import request from 'supertest';
import app from '../app';
import ModelFactory from '../models';
import { persistHealthRecord } from '../services/database';
import { getSignedUrl } from '../services/storage';

jest.requireActual('../middleware/logging');

jest.mock('express-winston', () => ({
  errorLogger: () => (req, res, next) => next(),
  logger: () => (req, res, next) => next()
}));
jest.mock('../config/logging');

jest.mock('../services/database/persist-health-record', () => ({
  persistHealthRecord: jest.fn().mockReturnValue(Promise.resolve('Persisted'))
}));

jest.mock('../services/storage/get-signed-url', () =>
  jest.fn().mockReturnValue(Promise.resolve('some-url'))
);

describe('health-record', () => {
  const nhsNumber = '0123456789';
  const conversationId = 'db4b773d-f171-4a5f-a23b-6a387f8792b7';
  const messageId = '0809570a-3ae2-409c-a924-60766b39550f';
  const manifest = ['0809570a-3ae2-409c-a924-60766b39550f', '88148835-2708-4914-a1d2-39c84560a937'];

  afterAll(() => {
    ModelFactory.sequelize.close();
  });

  afterEach(() => jest.clearAllMocks());

  describe('POST /health-record/{conversationId}/message', () => {
    const TEST_ENDPOINT = `/health-record/${conversationId}/message`;

    it('should return 201', done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send({
          messageId
        })
        .expect(201)
        .end(done);
    });

    it('should call getSignedUrl service with request body', done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send({
          messageId
        })
        .expect(() => {
          expect(getSignedUrl).toHaveBeenCalledWith(conversationId, messageId);
        })
        .end(done);
    });

    it('should return URL from s3 service', done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send({
          messageId
        })
        .expect(res => {
          expect(res.text).toEqual('some-url');
        })
        .end(done);
    });

    it('should return 422 if no messageId is provided in request body', done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send()
        .expect(422)
        .expect('Content-Type', /json/)
        .expect(res => {
          expect(res.body).toEqual({ errors: [{ messageId: 'Invalid value' }] });
        })
        .end(done);
    });
  });

  describe('POST /health-record/{conversationId}/new/message', () => {
    const TEST_ENDPOINT = `/health-record/${conversationId}/new/message`;

    it('should return 201', done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send({
          nhsNumber,
          messageId
        })
        .expect(201)
        .end(done);
    });

    it('should call persistHealthRecord with information provided', done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send({
          nhsNumber,
          messageId
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
        .post(TEST_ENDPOINT)
        .send({
          nhsNumber,
          messageId,
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
        .post(TEST_ENDPOINT)
        .send({
          nhsNumber,
          messageId
        })
        .expect(() => {
          expect(getSignedUrl).toHaveBeenCalledWith(conversationId, messageId);
        })
        .end(done);
    });

    it('should return URL from s3 service', done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send({
          nhsNumber,
          messageId
        })
        .expect(res => {
          expect(res.text).toEqual('some-url');
        })
        .end(done);
    });

    it('should return 422 if no messageId is provided in request body', done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send()
        .expect(422)
        .expect('Content-Type', /json/)
        .expect(res => {
          expect(res.body).toEqual({
            errors: [
              { messageId: "'messageId' provided is not of type UUIDv4" },
              { messageId: "'messageId' is a required field" }
            ]
          });
        })
        .end(done);
    });

    it('should throw error when nhsNumber is not numeric', done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send({
          nhsNumber: 'abcdefghij',
          messageId,
          manifest
        })
        .expect(422)
        .expect('Content-Type', /json/)
        .expect(res => {
          expect(res.body).toEqual({
            errors: [{ nhsNumber: "'nhsNumber' provided is not numeric" }]
          });
        })
        .end(done);
    });

    it('should throw error when nhsNumber is not 10 characters', done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send({
          nhsNumber: '123456789',
          messageId,
          manifest
        })
        .expect(422)
        .expect('Content-Type', /json/)
        .expect(res => {
          expect(res.body).toEqual({
            errors: [{ nhsNumber: "'nhsNumber' provided is not 10 characters" }]
          });
        })
        .end(done);
    });

    it('should throw an error when the conversationId is not UUID', done => {
      request(app)
        .post(`/health-record/123/new/message`)
        .send({
          nhsNumber,
          messageId,
          manifest
        })
        .expect(422)
        .expect('Content-Type', /json/)
        .expect(res => {
          expect(res.body).toEqual({
            errors: [{ conversationId: "'conversationId' provided is not of type UUIDv4" }]
          });
        })
        .end(done);
    });

    it('should throw an error when the manifest is not an array', done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send({
          nhsNumber,
          messageId,
          manifest: 'manifest'
        })
        .expect(422)
        .expect('Content-Type', /json/)
        .expect(res => {
          expect(res.body).toEqual({
            errors: [{ manifest: "'manifest' provided is not of type Array" }]
          });
        })
        .end(done);
    });
  });

  describe('PATCH /health-record/{conversationId}/message/{messageId}', () => {
    const TEST_ENDPOINT = `/health-record/${conversationId}/message/${messageId}`;

    it('should return 204', done => {
      request(app)
        .patch(TEST_ENDPOINT)
        .send({
          transferComplete: true
        })
        .expect(204)
        .end(done);
    });

    it('should return 422 if transferComplete is not provided in body', done => {
      request(app)
        .patch(TEST_ENDPOINT)
        .send()
        .expect(422)
        .expect(res => {
          expect(res.body).toEqual({ errors: [{ transferComplete: 'Invalid value' }] });
        })
        .end(done);
    });
  });
});
