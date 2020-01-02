import request from 'supertest';
import app from './app';
import getSignedUrl from './services/get-signed-url';
import getHealthCheck from './services/get-health-check';

jest.mock('./services/get-signed-url', () =>
  jest.fn().mockReturnValue(Promise.resolve('some-url'))
);
jest.mock('./services/get-health-check', () =>
  jest.fn().mockReturnValue(Promise.resolve('some-url'))
);
jest.mock('express-winston', () => ({
  errorLogger: () => (req, res, next) => next(),
  logger: () => (req, res, next) => next()
}));
jest.mock('./config/logging');

describe('POST /health-record/{conversationId}/message', () => {
  const conversationId = 'test-conversation-id';
  const TEST_ENDPOINT = `/health-record/${conversationId}/message`;

  const messageId = 'test-message-id';

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

  it('should return url from s3 when the endpoint being called', done => {
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

describe('PUT /health-record/{conversationId}/message/{messageId}', () => {
  const TEST_CONVERSATION_ID = 'test-conversation-id';
  const TEST_MESSAGE_ID = 'test-message-id';

  const TEST_ENDPOINT = `/health-record/${TEST_CONVERSATION_ID}/message/${TEST_MESSAGE_ID}`;

  it('should return 204', done => {
    request(app)
      .put(TEST_ENDPOINT)
      .send({
        transferComplete: true
      })
      .expect(204)
      .end(done);
  });

  it('should return 422 if transferComplete is not provided', done => {
    request(app)
      .put(TEST_ENDPOINT)
      .send()
      .expect(422)
      .expect(res => {
        expect(res.body).toEqual({ errors: [{ transferComplete: 'Invalid value' }] });
      })
      .end(done);
  });
});

describe('GET/health', () => {
  it('should return 200', done => {
    request(app)
      .get('/health')
      .expect(200)
      .end(done);
  });

  it('should call health check service when the endpoint being called ', done => {
    request(app)
      .get('/health')
      .expect(() => {
        expect(getHealthCheck).toHaveBeenCalled();
      })
      .end(done);
  });
});

describe('GET/error', () => {
  it('should call updateEventWithError when the error endpoint being called  ', done => {
    request(app)
      .get('/error')
      .expect(200)
      .expect(res => {
        expect(res.text).toEqual('Added test Error to the log');
      })
      .end(done);
  });
});
