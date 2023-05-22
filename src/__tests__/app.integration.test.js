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
                messageType: MessageType.ATTACHMENT,
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
      const attachmentId = uuid();
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
              attachmentMessageIds: [attachmentId],
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
      const attachmentId = uuid();
      const attachmentPartId = uuid();
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
              attachmentMessageIds: [attachmentId],
            },
          },
        })
        .set('Authorization', authorizationKeys);
      expect(messageResponse.status).toEqual(201);

      const attachmentRes = await request(app)
        .post(`/messages`)
        .send({
          data: {
            id: attachmentId,
            type: 'messages',
            attributes: {
              conversationId: conversationIdFromEhrIn,
              messageType: MessageType.ATTACHMENT,
              attachmentMessageIds: [attachmentPartId],
            },
          },
        })
        .set('Authorization', authorizationKeys);

      expect(attachmentResponse.status).toEqual(201);

      const attachmentPartResponse = await request(app)
        .post(`/messages`)
        .send({
          data: {
            id: attachmentPartId,
            type: 'messages',
            attributes: {
              conversationId: conversationIdFromEhrIn,
              messageType: MessageType.ATTACHMENT,
              attachmentMessageIds: [],
            },
          },
        })
        .set('Authorization', authorizationKeys);

      expect(attachmentPartResponse.status).toEqual(201);
      const conversationId = uuid();
      const patientRes = await request(app)
        .get(`/patients/${nhsNumber}`)
        .set('Authorization', authorizationKeys)
        .set('conversationId', conversationId);

      expect(patientRes.status).toEqual(200);
      expect(patientRes.body.coreMessageUrl).toContain(
        `${config.localstackUrl}/${config.awsS3BucketName}/${conversationIdFromEhrIn}/${healthRecordExtractId}`
      );
      expect(patientRes.body.fragmentMessageIds[0]).toEqual(attachmentId);
      expect(patientRes.body.fragmentMessageIds[1]).toEqual(attachmentPartId);
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
      const attachmentId = uuid();
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
              attachmentMessageIds: [attachmentId],
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

    const createReqBodyForAttachment = (messageId, conversationId, attachmentMessageIds = []) => ({
      data: {
        type: 'messages',
        id: messageId,
        attributes: {
          conversationId,
          messageType: MessageType.ATTACHMENT,
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

    it('should save health record without attachments in the database and return 201', async () => {
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

    it('should save health record with attachments in the database and return 201', async () => {
      const attachment = uuid();

      const response = await request(app)
        .post(`/messages`)
        .send(createReqBodyForEhr(messageId, conversationId, nhsNumber, [attachment]))
        .set('Authorization', authorizationKeys);

      const attachmentMessage = await Message.findByPk(attachment);
      const healthRecord = await HealthRecord.findByPk(conversationId);

      expect(attachmentMessage.conversationId).toBe(conversationId);
      expect(attachmentMessage.type).toBe(MessageType.ATTACHMENT);
      expect(attachmentMessage.parentId).toBe(messageId);
      expect(healthRecord.completedAt).toBeNull();
      expect(response.status).toBe(201);
      expectStructuredLogToContain(transportSpy, {
        messageId,
        conversationId,
        traceId: expect.anything(),
      });
    });

    it('should create large attachment parts messages in the database and return 201', async () => {
      const firstPartOfLargeAttachmentId = uuid();
      const restOfAttachmentId = uuid();

      await request(app)
        .post(`/messages`)
        .send(
          createReqBodyForEhr(messageId, conversationId, nhsNumber, [firstPartOfLargeAttachmentId])
        )
        .set('Authorization', authorizationKeys);

      const attachmentResponse = await request(app)
        .post(`/messages`)
        .send(
          createReqBodyForAttachment(firstPartOfLargeAttachmentId, conversationId, [
            restOfAttachmentId,
          ])
        )
        .set('Authorization', authorizationKeys);

      const restOfAttachmentMessage = await Message.findByPk(restOfAttachmentId);
      const healthRecord = await HealthRecord.findByPk(conversationId);

      expect(restOfAttachmentMessage.receivedAt).toBeNull();
      expect(healthRecord.completedAt).toBeNull();
      expect(attachmentResponse.status).toBe(201);
      expectStructuredLogToContain(transportSpy, {
        messageId: firstPartOfLargeAttachmentId,
        conversationId,
        traceId: expect.anything(),
      });
    });

    it('should update database for attachments and return 201 when all attachments have been received', async () => {
      const attachmentId = uuid();
      await request(app)
        .post(`/messages`)
        .send(createReqBodyForEhr(messageId, conversationId, nhsNumber, [attachmentId]))
        .set('Authorization', authorizationKeys);

      const attachmentResponse = await request(app)
        .post(`/messages`)
        .send(createReqBodyForAttachment(attachmentId, conversationId))
        .set('Authorization', authorizationKeys);

      const attachmentMessage = await Message.findByPk(attachmentId);
      const healthRecord = await HealthRecord.findByPk(conversationId);

      expect(attachmentMessage.receivedAt).not.toBeNull();
      expect(healthRecord.completedAt).not.toBeNull();
      expect(attachmentResponse.status).toBe(201);
      expectStructuredLogToContain(transportSpy, {
        messageId: attachmentId,
        conversationId,
        traceId: expect.anything(),
      });
    });

    it('should update database when attachment part arrives before first attachment part', async () => {
      const attachmentId = uuid();
      const attachmentPartId = uuid();
      await request(app)
        .post(`/messages`)
        .send(createReqBodyForEhr(messageId, conversationId, nhsNumber, [attachmentId]))
        .set('Authorization', authorizationKeys);

      const response = await request(app)
        .post(`/messages`)
        .send(createReqBodyForAttachment(attachmentPartId, conversationId))
        .set('Authorization', authorizationKeys);

      const attachmentPartMessage = await Message.findByPk(attachmentPartId);
      const healthRecord = await HealthRecord.findByPk(conversationId);

      expect(attachmentPartMessage.conversationId).toEqual(conversationId);
      expect(attachmentPartMessage.receivedAt).not.toBeNull();
      expect(healthRecord.completedAt).toBeNull();
      expect(response.status).toBe(201);
      expectStructuredLogToContain(transportSpy, {
        messageId: attachmentPartId,
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
