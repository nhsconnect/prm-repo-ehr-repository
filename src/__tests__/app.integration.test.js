import request from 'supertest';
import { v4 as uuid, v4 } from 'uuid';
import app from '../app';
import { initializeConfig } from '../config';
import { logger } from '../config/logging';
import { expectStructuredLogToContain, transportSpy } from '../__builders__/logging-helper';
import ModelFactory from '../models';
import { MessageType, modelName as messageModelName } from '../models/message';
import { modelName as healthRecordModelName } from '../models/health-record';

describe('app', () => {
  const config = initializeConfig();
  const authorizationKeys = 'correct-key';

  beforeEach(() => {
    process.env.API_KEY_FOR_TEST_USER = authorizationKeys;
    logger.add(transportSpy);
  });

  afterEach(() => {
    if (process.env.API_KEY_FOR_TEST_USER) {
      delete process.env.API_KEY_FOR_TEST_USER;
    }
  });

  describe('GET /messages/:conversationId/:messageId', () => {
    const conversationId = v4();
    const messageId = v4();

    it('should return presigned url', async () => {
      const response = await request(app)
        .get(`/messages/${conversationId}/${messageId}`)
        .set('Authorization', authorizationKeys);
      expect(response.status).toBe(200);
      expect(response.text).toContain(
        `${config.localstackUrl}/${config.awsS3BucketName}/${conversationId}/${messageId}`
      );
      expectStructuredLogToContain(transportSpy, {
        messageId,
        conversationId,
        traceId: expect.anything(),
      });
    });
  });

  describe('GET /fragments/:conversationId/:messageId', () => {
    // given
    const conversationId = v4();
    const coreMessageId = v4();
    const fragmentMessageId = v4();
    const nhsNumber = '2345678901';

    it('should return presigned url when the fragment record exists', async () => {
      // setting up database
      const coreMessageResponse = await request(app)
          .post(`/messages`)
          .send({
            data: {
              id: coreMessageId,
              type: 'messages',
              attributes: {
                conversationId,
                messageType: MessageType.EHR_EXTRACT,
                nhsNumber,
                attachmentMessageIds: [fragmentMessageId],
              },
            },
          })
          .set('Authorization', authorizationKeys);

      expect(coreMessageResponse.status).toEqual(201);

      const fragmentMessageResponse = await request(app)
          .post(`/messages`)
          .send({
            data: {
              id: fragmentMessageId,
              type: 'messages',
              attributes: {
                conversationId,
                messageType: MessageType.FRAGMENT,
                nhsNumber: "",
                attachmentMessageIds: []
              },
            },
          })
          .set('Authorization', authorizationKeys);

      expect(fragmentMessageResponse.status).toEqual(201);

      // when
      const response = await request(app)
          .get(`/fragments/${conversationId}/${fragmentMessageId}`)
          .set('Authorization', authorizationKeys);

      // then
      expect(response.status).toBe(200);
      expect(response.text).toContain(
          `${config.localstackUrl}/${config.awsS3BucketName}/${conversationId}/${fragmentMessageId}`
      );
      expectStructuredLogToContain(transportSpy, {
        messageId: fragmentMessageId,
        conversationId,
        traceId: expect.anything(),
      });
    });

    it('should return 404 when the fragment record is not found', async () => {
      // given
      const nonExistentMessageId = uuid();

      // when
      const response = await request(app)
          .get(`/fragments/${conversationId}/${nonExistentMessageId}`)
          .set('Authorization', authorizationKeys);

      // then
      expect(response.status).toBe(404);
      expectStructuredLogToContain(transportSpy, {conversationId, traceId: expect.anything()});
    })
  })

  describe('GET /patients/:nhsNumber/health-records/:conversationId', () => {
    it('should return 200', async () => {
      const conversationId = uuid();
      const messageId = uuid();
      const nhsNumber = '1234567890';

      const messageResponse = await request(app)
        .post(`/messages`)
        .send({
          data: {
            id: messageId,
            type: 'messages',
            attributes: {
              conversationId,
              messageType: MessageType.EHR_EXTRACT,
              nhsNumber,
              attachmentMessageIds: [],
            },
          },
        })
        .set('Authorization', authorizationKeys);

      expect(messageResponse.status).toEqual(201);

      const recordResponse = await request(app)
        .get(`/patients/${nhsNumber}/health-records/${conversationId}`)
        .set('Authorization', authorizationKeys);

      expect(recordResponse.status).toEqual(200);
      expectStructuredLogToContain(transportSpy, { conversationId, traceId: expect.anything() });
    });

    it('should return 404 when health record is not complete', async () => {
      const conversationId = uuid();
      const messageId = uuid();
      const fragmentId = uuid();
      const nhsNumber = '1234567890';

      const messageResponse = await request(app)
        .post(`/messages`)
        .send({
          data: {
            id: messageId,
            type: 'messages',
            attributes: {
              conversationId,
              messageType: MessageType.EHR_EXTRACT,
              nhsNumber,
              attachmentMessageIds: [fragmentId],
            },
          },
        })
        .set('Authorization', authorizationKeys);

      expect(messageResponse.status).toEqual(201);

      const recordResponse = await request(app)
        .get(`/patients/${nhsNumber}/health-records/${conversationId}`)
        .set('Authorization', authorizationKeys);

      expect(recordResponse.status).toEqual(404);
      expectStructuredLogToContain(transportSpy, { conversationId, traceId: expect.anything() });
    });

    it('should return 404 when health record is not found', async () => {
      const conversationId = uuid();
      const nhsNumber = '1234567890';

      const recordResponse = await request(app)
        .get(`/patients/${nhsNumber}/health-records/${conversationId}`)
        .set('Authorization', authorizationKeys);

      expect(recordResponse.status).toEqual(404);
      expectStructuredLogToContain(transportSpy, { conversationId, traceId: expect.anything() });
      expectStructuredLogToContain(transportSpy, { level: 'WARN' });
    });
  });

  describe('GET /patients/:nhsNumber', () => {
    it('should return 200 and patient health record link', async () => {
      const conversationIdFromEhrIn = uuid();
      const healthRecordExtractId = uuid();
      const fragmentId = uuid();
      const nestedFragmentID = uuid();
      const nhsNumber = '1234567890';

      const messageResponse = await request(app)
        .post(`/messages`)
        .send({
          data: {
            id: healthRecordExtractId,
            type: 'messages',
            attributes: {
              conversationId: conversationIdFromEhrIn,
              messageType: MessageType.EHR_EXTRACT,
              nhsNumber,
              attachmentMessageIds: [fragmentId],
            },
          },
        })
        .set('Authorization', authorizationKeys);
      expect(messageResponse.status).toEqual(201);

      const fragmentResponse = await request(app)
        .post(`/messages`)
        .send({
          data: {
            id: fragmentId,
            type: 'messages',
            attributes: {
              conversationId: conversationIdFromEhrIn,
              messageType: MessageType.FRAGMENT,
              attachmentMessageIds: [nestedFragmentID],
            },
          },
        })
        .set('Authorization', authorizationKeys);

      expect(fragmentResponse.status).toEqual(201);

      const nestedFragmentResponse = await request(app)
        .post(`/messages`)
        .send({
          data: {
            id: nestedFragmentID,
            type: 'messages',
            attributes: {
              conversationId: conversationIdFromEhrIn,
              messageType: MessageType.FRAGMENT,
              attachmentMessageIds: [],
            },
          },
        })
        .set('Authorization', authorizationKeys);

      expect(nestedFragmentResponse.status).toEqual(201);
      const conversationId = uuid();
      const patientRes = await request(app)
        .get(`/patients/${nhsNumber}`)
        .set('Authorization', authorizationKeys)
        .set('conversationId', conversationId);

      expect(patientRes.status).toEqual(200);
      expect(patientRes.body.coreMessageUrl).toContain(
        `${config.localstackUrl}/${config.awsS3BucketName}/${conversationIdFromEhrIn}/${healthRecordExtractId}`
      );
      expect(patientRes.body.fragmentMessageIds[0]).toEqual(fragmentId);
      expect(patientRes.body.fragmentMessageIds[1]).toEqual(nestedFragmentID);
      expect(patientRes.body.conversationIdFromEhrIn).toEqual(conversationIdFromEhrIn);
      expectStructuredLogToContain(transportSpy, {
        conversationId: conversationId,
        traceId: expect.anything(),
      });
    });

    it('should have conversation Id in the logging context', async () => {
      const conversationId = uuid();
      const nhsNumber = '1234567890';
      const patientResponse = await request(app)
        .get(`/patients/${nhsNumber}`)
        .set('Authorization', authorizationKeys)
        .set('conversationId', conversationId);

      expect(patientResponse.status).toEqual(200);

      expectStructuredLogToContain(transportSpy, {
        conversationId: conversationId,
        traceId: expect.anything(),
      });
    });

    it('should return a 404 if no complete health record is found', async () => {
      const conversationId = uuid();
      const healthRecordExtractId = uuid();
      const fragmentId = uuid();
      const nhsNumber = '1234567891';

      const messageResponse = await request(app)
        .post(`/messages`)
        .send({
          data: {
            id: healthRecordExtractId,
            type: 'messages',
            attributes: {
              conversationId,
              messageType: MessageType.EHR_EXTRACT,
              nhsNumber,
              attachmentMessageIds: [fragmentId],
            },
          },
        })
        .set('Authorization', authorizationKeys);

      expect(messageResponse.status).toEqual(201);

      const response = await request(app)
        .get(`/patients/${nhsNumber}`)
        .set({ Authorization: authorizationKeys, conversationId: conversationId });

      expect(response.status).toEqual(404);
      expectStructuredLogToContain(transportSpy, { traceId: expect.anything() });
      expectStructuredLogToContain(transportSpy, { level: 'WARN' });
    });
  });

  describe('POST /messages', () => {
    const Message = ModelFactory.getByName(messageModelName);
    const HealthRecord = ModelFactory.getByName(healthRecordModelName);
    const nhsNumber = '1234567890';
    let conversationId;
    let messageId;

    const createReqBodyForEhr = (messageId, conversationId, nhsNumber, attachmentMessageIds) => ({
      data: {
        type: 'messages',
        id: messageId,
        attributes: {
          conversationId,
          messageType: MessageType.EHR_EXTRACT,
          nhsNumber,
          attachmentMessageIds,
        },
      },
    });

    const createReqBodyForFragment = (messageId, conversationId, attachmentMessageIds = []) => ({
      data: {
        type: 'messages',
        id: messageId,
        attributes: {
          conversationId,
          messageType: MessageType.FRAGMENT,
          attachmentMessageIds: attachmentMessageIds,
        },
      },
    });

    beforeEach(() => {
      messageId = uuid();
      conversationId = uuid();
    });

    afterAll(async () => {
      await ModelFactory.sequelize.close();
    });

    it('should save health record without fragmentss in the database and return 201', async () => {
      const response = await request(app)
        .post(`/messages`)
        .send(createReqBodyForEhr(messageId, conversationId, nhsNumber, []))
        .set('Authorization', authorizationKeys);

      const message = await Message.findByPk(messageId);
      const healthRecord = await HealthRecord.findByPk(conversationId);

      expect(message.conversationId).toBe(conversationId);
      expect(message.type).toBe(MessageType.EHR_EXTRACT);
      expect(message.parentId).toBeNull();
      expect(healthRecord.nhsNumber).toBe(nhsNumber);
      expect(healthRecord.completedAt).not.toBeNull();
      expect(response.status).toBe(201);
      expectStructuredLogToContain(transportSpy, {
        messageId,
        conversationId,
        traceId: expect.anything(),
      });
    });

    it('should save health record with fragments in the database and return 201', async () => {
      const fragmentMessageId = uuid();

      const response = await request(app)
        .post(`/messages`)
        .send(createReqBodyForEhr(messageId, conversationId, nhsNumber, [fragmentMessageId]))
        .set('Authorization', authorizationKeys);

      const fragmentMessage = await Message.findByPk(fragmentMessageId);
      const healthRecord = await HealthRecord.findByPk(conversationId);

      expect(fragmentMessage.conversationId).toBe(conversationId);
      expect(fragmentMessage.type).toBe(MessageType.FRAGMENT);
      expect(fragmentMessage.parentId).toBe(messageId);
      expect(healthRecord.completedAt).toBeNull();
      expect(response.status).toBe(201);
      expectStructuredLogToContain(transportSpy, {
        messageId,
        conversationId,
        traceId: expect.anything(),
      });
    });

    it('should create large nested fragment messages in the database and return 201', async () => {
      const fragmentMessageId = uuid();
      const nestedFragmentMessageId = uuid();

      await request(app)
        .post(`/messages`)
        .send(
          createReqBodyForEhr(messageId, conversationId, nhsNumber, [fragmentMessageId])
        )
        .set('Authorization', authorizationKeys);

      const fragmentResponse = await request(app)
        .post(`/messages`)
        .send(
          createReqBodyForFragment(fragmentMessageId, conversationId, [
            nestedFragmentMessageId,
          ])
        )
        .set('Authorization', authorizationKeys);

      const nestedFragmentMessage = await Message.findByPk(nestedFragmentMessageId);
      const healthRecord = await HealthRecord.findByPk(conversationId);

      expect(nestedFragmentMessage.receivedAt).toBeNull();
      expect(healthRecord.completedAt).toBeNull();
      expect(fragmentResponse.status).toBe(201);
      expectStructuredLogToContain(transportSpy, {
        messageId: fragmentMessageId,
        conversationId,
        traceId: expect.anything(),
      });
    });

    it('should update database for fragments and return 201 when all fragments have been received', async () => {
      const fragmentMessageId = uuid();
      await request(app)
        .post(`/messages`)
        .send(createReqBodyForEhr(messageId, conversationId, nhsNumber, [fragmentMessageId]))
        .set('Authorization', authorizationKeys);

      const fragmentResponse = await request(app)
        .post(`/messages`)
        .send(createReqBodyForFragment(fragmentMessageId, conversationId))
        .set('Authorization', authorizationKeys);

      const fragmentMessage = await Message.findByPk(fragmentMessageId);
      const healthRecord = await HealthRecord.findByPk(conversationId);

      expect(fragmentMessage.receivedAt).not.toBeNull();
      expect(healthRecord.completedAt).not.toBeNull();
      expect(fragmentResponse.status).toBe(201);
      expectStructuredLogToContain(transportSpy, {
        messageId: fragmentMessageId,
        conversationId,
        traceId: expect.anything(),
      });
    });

    it('should update database when a nested fragment arrives before its parent fragment', async () => {
      const fragmentMessageId = uuid();
      const nestedFragmentId = uuid();
      await request(app)
        .post(`/messages`)
        .send(createReqBodyForEhr(messageId, conversationId, nhsNumber, [fragmentMessageId]))
        .set('Authorization', authorizationKeys);

      const response = await request(app)
        .post(`/messages`)
        .send(createReqBodyForFragment(nestedFragmentId, conversationId))
        .set('Authorization', authorizationKeys);

      const nestedFragmentMessage = await Message.findByPk(nestedFragmentId);
      const healthRecord = await HealthRecord.findByPk(conversationId);

      expect(nestedFragmentMessage.conversationId).toEqual(conversationId);
      expect(nestedFragmentMessage.receivedAt).not.toBeNull();
      expect(healthRecord.completedAt).toBeNull();
      expect(response.status).toBe(201);
      expectStructuredLogToContain(transportSpy, {
        messageId: nestedFragmentId,
        conversationId,
        traceId: expect.anything(),
      });
    });

    it('should log with traceId provided in request header', async () => {
      await request(app)
        .post(`/messages`)
        .send(createReqBodyForEhr(messageId, conversationId, nhsNumber, []))
        .set('Authorization', authorizationKeys)
        .set('traceid', 'our trace ID');

      expectStructuredLogToContain(transportSpy, {
        traceId: 'our trace ID',
      });
    });
  });
});
