import request from 'supertest';
import uuid from 'uuid/v4';
import app from '../app';
import config from '../config';
import ModelFactory from '../models';

jest.mock('../middleware/logging');
jest.mock('../middleware/auth');

describe('POST /fragments', () => {
  const TEST_ENDPOINT = `/fragments`;
  const conversationId = uuid();
  const messageId = uuid();
  const nhsNumber = '1234567890';

  afterAll(() => {
    ModelFactory.sequelize.close();
  });

  it('should return presigned url', done => {
    request(app)
      .post(TEST_ENDPOINT)
      .send({ conversationId, messageId })
      .expect(res => {
        expect(res.text).toContain(
          `${config.localstackUrl}/${config.awsS3BucketName}/${conversationId}/${messageId}`
        );
      })
      .end(done);
  });

  it('should return 201', done => {
    request(app)
      .post(TEST_ENDPOINT)
      .send({
        nhsNumber,
        messageId,
        conversationId
      })
      .expect(201)
      .end(done);
  });
});
