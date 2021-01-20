import request from 'supertest';
import { v4 as uuid } from 'uuid';
import app from '../app';
import config from '../config';

jest.mock('../middleware/logging');
jest.mock('../middleware/auth');

describe('GET /patients/:nhsNumber', () => {
  it('should return 200 and most recent complete health record conversation id', async () => {
    const nhsNumber = '5555555555';
    const messageId = '5BCF9BC1-190A-4C1C-814D-0FA6EF3ECCE6';
    const conversationId = '6952C28C-B806-44F9-9B06-6BFE2E99DCBA';
    const res = await request(app).get(`/patients/${nhsNumber}`);

    expect(res.status).toBe(200);
    expect(res.body.data.links.currentEhr).toContain(
      `${config.localstackUrl}/${config.awsS3BucketName}/${conversationId}/${messageId}`
    );
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
