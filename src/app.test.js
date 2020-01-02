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
jest.mock('./config/logging');
jest.mock('express-winston', () => ({
  errorLogger: () => (req, res, next) => next(),
  logger: () => (req, res, next) => next()
}));

describe('POST /health-record', () => {
  const TEST_MESSAGE_ID = 'test-message-id';
  const TEST_CONVERSATION_ID = 'test-conversation-id';
  const TEST_ENDPOINT = '/health-record';

  it('should return 202', done => {
    request(app)
      .post(TEST_ENDPOINT)
      .send({
        conversationId: TEST_CONVERSATION_ID,
        messageId: TEST_MESSAGE_ID
      })
      .expect(202)
      .end(done);
  });

  it('should call getSignedUrl service with request body', done => {
    request(app)
      .post(TEST_ENDPOINT)
      .send({
        conversationId: TEST_CONVERSATION_ID,
        messageId: TEST_MESSAGE_ID
      })
      .expect(() => {
        expect(getSignedUrl).toHaveBeenCalledWith(TEST_CONVERSATION_ID, TEST_MESSAGE_ID);
      })
      .end(done);
  });

  it('should return url from s3 when the endpoint being called', done => {
    request(app)
      .post(TEST_ENDPOINT)
      .send({
        conversationId: TEST_CONVERSATION_ID,
        messageId: TEST_MESSAGE_ID
      })
      .expect(res => {
        expect(res.text).toEqual('some-url');
      })
      .end(done);
  });

  it('should return 422 if no conversationId is provided in request body', done => {
    request(app)
      .post(TEST_ENDPOINT)
      .send({
        messageId: TEST_MESSAGE_ID
      })
      .expect(422)
      .expect('Content-Type', /json/)
      .expect(res => {
        expect(res.body).toEqual({ errors: [{ conversationId: 'Invalid value' }] });
      })
      .end(done);
  });

  it('should return 422 if no messageId is provided in request body', done => {
    request(app)
      .post(TEST_ENDPOINT)
      .send({
        conversationId: TEST_CONVERSATION_ID
      })
      .expect(422)
      .expect('Content-Type', /json/)
      .expect(res => {
        expect(res.body).toEqual({ errors: [{ messageId: 'Invalid value' }] });
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
