import request from 'supertest';
import uuid from 'uuid/v4';
import app from './app';
import getSignedUrl from './services/get-signed-url';
import ModelFactory from './database/models';

jest.mock('./config/logging');

jest.mock('express-winston', () => ({
  errorLogger: () => (req, res, next) => next(),
  logger: () => (req, res, next) => next()
}));


describe('POST /health-record', () => {
  describe('when running locally', () => {

    afterAll(() => {
      ModelFactory.sequelize.close();
    });

    it('should return fake url', () => {
      const conversationId = uuid();
      const messageId = uuid();
      return request(app)
        .post(`/health-record/${conversationId}/message`)
        .send({
          messageId
        })
        .then(() => {
          return getSignedUrl(conversationId, messageId).then(url => {
            expect(url).toContain('https://');
            expect(url).toContain(process.env.S3_BUCKET_NAME);
            expect(url).toContain(messageId);
            return expect(url).toContain(conversationId);
          });
        });
    });
  });
});
