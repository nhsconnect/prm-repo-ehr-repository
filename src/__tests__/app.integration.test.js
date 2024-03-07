import request from 'supertest';
import { v4 as uuid, v4 } from 'uuid';
import app from '../app';
import { initializeConfig } from '../config';
import { logger } from '../config/logging';
import { expectStructuredLogToContain, transportSpy } from '../__builders__/logging-helper';
import ModelFactory from '../models';
import { MessageType, modelName as messageModelName } from '../models/message';
import { modelName as healthRecordModelName } from '../models/health-record';
import { EhrTransferTracker } from "../services/database/dynamo-ehr-transfer-tracker";
import { getCoreByKey } from "../services/database/ehr-core-repository";
import { cleanupRecordsForTest, createConversationForTest } from "../utilities/integration-test-utilities";
import { getConversationById } from "../services/database/ehr-conversation-repository";
import { ConversationStatus } from "../models/enums";
import { isCore } from "../models/core";
import { getFragmentByKey } from "../services/database/ehr-fragment-repository";
import { isFragment } from "../models/fragment";
import { isInCompleteStatus } from "../models/conversation";
import { TIMESTAMP_REGEX } from "../services/time";

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
              fragmentMessageIds: [fragmentMessageId],
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
              nhsNumber: '',
              fragmentMessageIds: [],
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
      expectStructuredLogToContain(transportSpy, { conversationId, traceId: expect.anything() });
    });
  });

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
              fragmentMessageIds: [],
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
              fragmentMessageIds: [fragmentId],
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
      const nestedFragmentId = uuid();
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
              fragmentMessageIds: [fragmentId],
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
              fragmentMessageIds: [nestedFragmentId],
            },
          },
        })
        .set('Authorization', authorizationKeys);

      expect(fragmentResponse.status).toEqual(201);

      const nestedFragmentResponse = await request(app)
        .post(`/messages`)
        .send({
          data: {
            id: nestedFragmentId,
            type: 'messages',
            attributes: {
              conversationId: conversationIdFromEhrIn,
              messageType: MessageType.FRAGMENT,
              fragmentMessageIds: [],
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
      expect(patientRes.body.fragmentMessageIds[1]).toEqual(nestedFragmentId);
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
              fragmentMessageIds: [fragmentId],
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
    const db = EhrTransferTracker.getInstance();
    const nhsNumber = '1234567890';
    let conversationId;
    let messageId;

    const createReqBodyForEhr = (messageId, conversationId, nhsNumber, fragmentMessageIds) => ({
      data: {
        type: 'messages',
        id: messageId,
        attributes: {
          conversationId,
          messageType: MessageType.EHR_EXTRACT,
          nhsNumber,
          fragmentMessageIds,
        },
      },
    });

    const createReqBodyForFragment = (messageId, conversationId, fragmentMessageIds = []) => ({
      data: {
        type: 'messages',
        id: messageId,
        attributes: {
          conversationId,
          messageType: MessageType.FRAGMENT,
          fragmentMessageIds: fragmentMessageIds,
        },
      },
    });

    beforeEach(() => {
      messageId = uuid();
      conversationId = uuid();
      createConversationForTest(conversationId, nhsNumber, {TransferStatus: ConversationStatus.STARTED})
    });

    afterEach(() => {
      cleanupRecordsForTest(conversationId);
    })

    afterAll(async () => {
      await ModelFactory.sequelize.close();
    });

    it('should save health record without fragments in the database and return 201', async () => {
      // when
      const response = await request(app)
        .post(`/messages`)
        .send(createReqBodyForEhr(messageId, conversationId, nhsNumber, []))
        .set('Authorization', authorizationKeys);

      // then
      const message = await getCoreByKey(conversationId, messageId);
      const conversation = await getConversationById(conversationId);

      expect(message.InboundConversationId).toBe(conversationId);
      expect(isCore(message)).toBe(true);
      expect(message.ParentId).toBeUndefined();
      expect(conversation.NhsNumber).toBe(nhsNumber);
      expect(conversation.TransferStatus).toBe(ConversationStatus.COMPLETE)
      expect(response.status).toBe(201);
      expectStructuredLogToContain(transportSpy, {
        messageId,
        conversationId,
        traceId: expect.anything(),
      });
    });

    it('should save health record with fragments in the database and return 201', async () => {
      // given
      const fragmentMessageId = uuid();

      // when
      const response = await request(app)
        .post(`/messages`)
        .send(createReqBodyForEhr(messageId, conversationId, nhsNumber, [fragmentMessageId]))
        .set('Authorization', authorizationKeys);

      // then
      const fragmentMessage = await getFragmentByKey(conversationId, fragmentMessageId);
      const conversation = await getConversationById(conversationId);

      expect(fragmentMessage.InboundConversationId).toBe(conversationId);
      expect(isFragment(fragmentMessage)).toBe(true);
      expect(fragmentMessage.ParentId).toBe(messageId);
      expect(conversation.TransferStatus).toBe(ConversationStatus.STARTED);
      expect(response.status).toBe(201);
      expectStructuredLogToContain(transportSpy, {
        messageId,
        conversationId,
        traceId: expect.anything(),
      });
    });

    it('should create large nested fragment messages in the database and return 201', async () => {
      // given
      const fragmentMessageId = uuid();
      const nestedFragmentMessageId = uuid();

      // when
      await request(app)
        .post(`/messages`)
        .send(createReqBodyForEhr(messageId, conversationId, nhsNumber, [fragmentMessageId]))
        .set('Authorization', authorizationKeys);

      const fragmentResponse = await request(app)
        .post(`/messages`)
        .send(
          createReqBodyForFragment(fragmentMessageId, conversationId, [nestedFragmentMessageId])
        )
        .set('Authorization', authorizationKeys);

      // then
      const nestedFragmentMessage = await getFragmentByKey(conversationId, nestedFragmentMessageId);
      const conversation = await getConversationById(conversationId);

      expect(nestedFragmentMessage.ReceivedAt).toBeUndefined();
      expect(conversation.TransferStatus).toBe(ConversationStatus.STARTED);
      expect(fragmentResponse.status).toBe(201);
      expectStructuredLogToContain(transportSpy, {
        messageId: fragmentMessageId,
        conversationId,
        traceId: expect.anything(),
      });
    });

    it('should update database for fragments and return 201 when all fragments have been received', async () => {
      // given
      const fragmentMessageId = uuid();

      // when
      await request(app)
        .post(`/messages`)
        .send(createReqBodyForEhr(messageId, conversationId, nhsNumber, [fragmentMessageId]))
        .set('Authorization', authorizationKeys);

      const fragmentResponse = await request(app)
        .post(`/messages`)
        .send(createReqBodyForFragment(fragmentMessageId, conversationId))
        .set('Authorization', authorizationKeys);

      // then
      const fragmentMessage = await getFragmentByKey(conversationId, fragmentMessageId);
      const conversation = await getConversationById(conversationId);

      expect(fragmentMessage.ReceivedAt).toEqual(expect.stringMatching(TIMESTAMP_REGEX));
      expect(conversation.TransferStatus).toBe(ConversationStatus.COMPLETE);
      expect(fragmentResponse.status).toBe(201);
      expectStructuredLogToContain(transportSpy, {
        messageId: fragmentMessageId,
        conversationId,
        traceId: expect.anything(),
      });
    });

    it('should update database when a nested fragment arrives before its parent fragment', async () => {
      // given
      const fragmentMessageId = uuid();
      const nestedFragmentId = uuid();

      // when
      await request(app)
        .post(`/messages`)
        .send(createReqBodyForEhr(messageId, conversationId, nhsNumber, [fragmentMessageId]))
        .set('Authorization', authorizationKeys);

      const response = await request(app)
        .post(`/messages`)
        .send(createReqBodyForFragment(nestedFragmentId, conversationId))
        .set('Authorization', authorizationKeys);

      // then
      const nestedFragmentMessage = await getFragmentByKey(conversationId, nestedFragmentId);
      const conversation = await getConversationById(conversationId);

      expect(nestedFragmentMessage.InboundConversationId).toEqual(conversationId);
      expect(nestedFragmentMessage.ReceivedAt).toEqual(expect.stringMatching(TIMESTAMP_REGEX));
      expect(conversation.TransferStatus).toBe(ConversationStatus.STARTED);
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
