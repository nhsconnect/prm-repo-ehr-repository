import request from 'supertest';
import uuid from 'uuid/v4';
import app from './app';
import config from './config';
import ModelFactory from './database/models';

jest.mock('./config/logging');
jest.mock('express-winston', () => ({
  errorLogger: () => (req, res, next) => next(),
  logger: () => (req, res, next) => next()
}));

describe('POST /health-record/:conversationId/message', () => {
  afterAll(() => {
    ModelFactory.sequelize.close();
  });

  it('should return presigned url', done => {
    const conversationId = uuid();
    const messageId = uuid();

    request(app)
      .post(`/health-record/${conversationId}/message`)
      .send({ messageId })
      .expect(res => {
        expect(res.text).toContain(
          `${config.localstackUrl}/${config.awsS3BucketName}/${conversationId}/${messageId}`
        );
      })
      .end(done);
  });
});
