import request from 'supertest';
import uuid from 'uuid/v4';
import app from '../app';
import config from '../config';
import getSignedUrl from '../services/storage/get-signed-url';

jest.mock('../middleware/logging');
jest.mock('../middleware/auth');
jest.mock('../services/storage/get-signed-url');

describe('GET /patients/:nhsNumber', () => {
  it('should return 200 and most recent complete health record conversation id', async () => {
    getSignedUrl.mockReturnValue('fake-url');
    const nhsNumber = '5555555555';
    const res = await request(app).get(`/patients/${nhsNumber}`);

    expect(res.status).toBe(200);
    expect(res.body.data.attributes.presignedUrl).toBe('fake-url');
  });

  it('should return 404 when complete health record is not found', async () => {
    const nhsNumber = '1111111111';
    const res = await request(app).get(`/patients/${nhsNumber}`);

    expect(res.status).toBe(404);
  });

  it('should return 404 when patient is not found', async () => {
    const missingNhsNumber = '0009991112';
    const res = await request(app).get(`/patients/${missingNhsNumber}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /fragments', () => {
  const conversationId = uuid();
  const isLargeMessage = true;
  const messageId = uuid();
  const nhsNumber = '1234567890';

  it('should return presigned url', async () => {
    const res = await request(app)
      .post('/fragments')
      .send({ conversationId, messageId });
    expect(res.text).toContain(
      `${config.localstackUrl}/${config.awsS3BucketName}/${conversationId}/${messageId}`
    );
  });

  it('should return 201', async () => {
    const res = await request(app)
      .post('/fragments')
      .send({
        nhsNumber,
        messageId,
        conversationId,
        isLargeMessage
      });
    expect(res.status).toBe(201);
  });
});
