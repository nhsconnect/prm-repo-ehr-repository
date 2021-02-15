import request from 'supertest';
import { v4 as uuid, v4 } from 'uuid';
import app from '../app';
import config from '../config';
import ModelFactory from '../models';
import { modelName } from '../models/message';

jest.mock('../middleware/logging');

describe('Old API', () => {
  beforeEach(() => {
    process.env.AUTHORIZATION_KEYS = 'correct-key';
  });

  afterEach(() => {
    if (process.env.AUTHORIZATION_KEYS) {
      delete process.env.AUTHORIZATION_KEYS;
    }
  });

  describe('GET /patients/:nhsNumber', () => {
    it('should return 200 and most recent complete health record conversation id', async () => {
      const nhsNumber = '5555555555';
      const messageId = '5bcf9bc1-190a-4c1c-814d-0fa6ef3ecce6';
      const conversationId = '6952c28c-b806-44f9-9b06-6bfe2e99dcba';
      const res = await request(app)
        .get(`/patients/${nhsNumber}`)
        .set('Authorization', 'correct-key');
      expect(res.status).toBe(200);
      expect(res.body.data.links.currentEhr).toContain(
        `${config.localstackUrl}/${config.awsS3BucketName}/${conversationId}/${messageId}`
      );
    });

    it('should return 404 when complete health record is not found', async () => {
      const nhsNumber = '1111111111';
      const res = await request(app)
        .get(`/patients/${nhsNumber}`)
        .set('Authorization', 'correct-key');
      expect(res.status).toBe(404);
    });

    it('should return 404 when patient is not found', async () => {
      const missingNhsNumber = '0009991112';
      const res = await request(app)
        .get(`/patients/${missingNhsNumber}`)
        .set('Authorization', 'correct-key');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /fragments', () => {
    const conversationId = v4();
    const isLargeMessage = true;
    const messageId = v4();
    const nhsNumber = '1234567890';

    it('should return presigned url', async () => {
      const res = await request(app)
        .post('/fragments')
        .send({ conversationId, messageId })
        .set('Authorization', 'correct-key');
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
        })
        .set('Authorization', 'correct-key');
      expect(res.status).toBe(201);
    });
  });
});

describe('New API', () => {
  beforeEach(() => {
    process.env.AUTHORIZATION_KEYS = 'correct-key';
  });

  afterEach(() => {
    if (process.env.AUTHORIZATION_KEYS) {
      delete process.env.AUTHORIZATION_KEYS;
    }
  });

  describe('GET /messages/:conversationId/:messageId', () => {
    const conversationId = v4();
    const messageId = v4();

    it('should return presigned url', async () => {
      config.awsS3BucketName = 'some-bucket';
      config.localstackUrl = 'localstack';

      const res = await request(app)
        .get(`/messages/${conversationId}/${messageId}`)
        .set('Authorization', 'correct-key');
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain(
        `${config.localstackUrl}/${config.awsS3BucketName}/${conversationId}/${messageId}`
      );
    });
  });

  describe('POST /messages', () => {
    const Message = ModelFactory.getByName(modelName);
    const conversationId = uuid();
    const nhsNumber = '1234567890';
    const messageId = uuid();
    const messageType = 'ehrExtract';
    const listOfMessageIds = [];
    const requestBody = {
      data: {
        type: 'messages',
        id: messageId,
        attributes: {
          conversationId,
          messageType,
          nhsNumber,
          listOfMessageIds
        }
      }
    };

    afterAll(async () => {
      await ModelFactory.sequelize.close();
    });

    it('should save the message metadata in the database and return 201', async () => {
      const res = await request(app)
        .post(`/messages`)
        .send(requestBody)
        .set('Authorization', 'correct-key');

      const message = await Message.findByPk(messageId);

      expect(message.conversationId).toBe(conversationId);
      expect(message.type).toBe(messageType);
      expect(message.parentId).toBeUndefined();
      expect(res.status).toBe(201);
    });
  });
});
