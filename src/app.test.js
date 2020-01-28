import request from 'supertest';
import app from './app';
import ModelFactory from './models';
import { getHealthCheck } from './services/get-health-check';

jest.requireActual('./middleware/logging');

jest.mock('express-winston', () => ({
  errorLogger: () => (req, res, next) => next(),
  logger: () => (req, res, next) => next()
}));
jest.mock('./config/logging');

jest.mock('./services/storage/get-signed-url', () =>
  jest.fn().mockReturnValue(Promise.resolve('some-url'))
);

jest.mock('./services/get-health-check');

describe('app', () => {

  const conversationId = 'test-conversation-id';
  const messageId = 'test-message-id';

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
  });

  describe('POST /health-record/{conversationId}/new/message', () => {

    const TEST_ENDPOINT = `/health-record/${conversationId}/new/message`;
    const nhsNumber = '123567890';

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
  });

  describe('PUT /health-record/{conversationId}/message/{messageId}', () => {

    const TEST_ENDPOINT = `/health-record/${conversationId}/message/${messageId}`;

    it('should return 204', done => {
      request(app)
        .put(TEST_ENDPOINT)
        .send({
          transferComplete: true
        })
        .expect(204)
        .end(done);
    });
  });

  describe('GET /health', () => {

    beforeEach(() => {
      getHealthCheck.mockReturnValue(
        Promise.resolve({
          details: {
            filestore: {
              writable: true,
              available: true
            },
            database: {
              writable: true
            }
          }
        })
      );
    });

    it('should return 200', done => {
      request(app)
        .get('/health')
        .expect(200)
        .end(done);
    });

    it('should call health check service', done => {
      request(app)
        .get('/health')
        .expect(() => {
          expect(getHealthCheck).toHaveBeenCalled();
        })
        .end(done);
    });
  });
});
