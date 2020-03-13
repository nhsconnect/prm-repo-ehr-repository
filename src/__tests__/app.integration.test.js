import request from 'supertest';
import uuid from 'uuid/v4';
import app from '../app';
import config from '../config';
import ModelFactory from '../models';

jest.mock('../middleware/logging');

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

  describe('POST /health-record/{conversationId}/new/message', () => {
    const testUUID = '04d71080-e9da-4b3d-8f6f-0bfea8786187';
    const TEST_ENDPOINT = `/health-record/${testUUID}/new/message`;
    const nhsNumber = '1234567890';

    it('should return 201', done => {
      request(app)
        .post(TEST_ENDPOINT)
        .send({
          nhsNumber,
          messageId: testUUID
        })
        .expect(201)
        .end(done);
    });
  });
});
