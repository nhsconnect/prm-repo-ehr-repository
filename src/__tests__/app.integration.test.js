import request from 'supertest';
import { v4 as uuid, v4 } from 'uuid';
import app from '../app';
import { initializeConfig } from '../config';
import { logger } from '../config/logging';
import { expectStructuredLogToContain, transportSpy } from '../__builders__/logging-helper';
import { EhrTransferTracker } from '../services/database/dynamo-ehr-transfer-tracker';
import { getCoreByKey } from '../services/database/ehr-core-repository';
import {
  cleanupRecordsForTest,
  cleanupRecordsForTestByNhsNumber,
  createConversationForTest,
} from '../utilities/integration-test-utilities';
import { getConversationById } from '../services/database/ehr-conversation-repository';
import { ConversationStatus, MessageType, RecordType } from "../models/enums";
import { isCore } from '../models/core';
import { getFragmentByKey } from '../services/database/ehr-fragment-repository';
import { isFragment } from '../models/fragment';
import { TIMESTAMP_REGEX } from '../services/time';

describe('app', () => {
  const config = initializeConfig();
  const authorizationKeys = 'correct-key';

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
    const conversationId = v4();
    const coreMessageId = v4();
    const fragmentMessageId = v4();
    const nhsNumber = '2345678901';

    const db = EhrTransferTracker.getInstance();

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
      // given
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

      // when
      const recordResponse = await request(app)
        .get(`/patients/${nhsNumber}/health-records/${conversationId}`)
        .set('Authorization', authorizationKeys);

      // then
      expect(recordResponse.status).toEqual(200);
      expectStructuredLogToContain(transportSpy, { conversationId, traceId: expect.anything() });
    });

    it('should return 404 when health record is not complete', async () => {
      // given
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

      // when
      const recordResponse = await request(app)
        .get(`/patients/${nhsNumber}/health-records/${conversationId}`)
        .set('Authorization', authorizationKeys);

      // then
      expect(recordResponse.status).toEqual(404);
      expectStructuredLogToContain(transportSpy, { conversationId, traceId: expect.anything() });
    });

    it('should return 404 when health record is not found', async () => {
      // given
      const conversationId = uuid();
      const nhsNumber = '1234567890';

      // when
      const recordResponse = await request(app)
        .get(`/patients/${nhsNumber}/health-records/${conversationId}`)
        .set('Authorization', authorizationKeys);

      // then
      expect(recordResponse.status).toEqual(404);
      expectStructuredLogToContain(transportSpy, { conversationId, traceId: expect.anything() });
      expectStructuredLogToContain(transportSpy, { level: 'WARN' });
    });
  });

  describe('GET /patients/:nhsNumber', () => {
    // tear down to avoid interfering other tests
    afterAll(async () => {
      await cleanupRecordsForTestByNhsNumber('1234567890');
      await cleanupRecordsForTestByNhsNumber('1234567891');
    });

    it('should return 200 and patient health record link', async () => {
      // ===============  given  ====================
      const nhsNumber = '1234567890';
      const inboundConversationId = uuid();
      const coreMessageId = uuid();
      const fragmentId = uuid();
      const nestedFragmentId = uuid();

      // mimic the record at Conversation Layer, which should in actual case should be already created by ehr-transfer-service
      await createConversationForTest(inboundConversationId, nhsNumber, {
        TransferStatus: ConversationStatus.STARTED,
      });

      const messageResponse = await request(app)
        .post(`/messages`)
        .send({
          data: {
            id: coreMessageId,
            type: 'messages',
            attributes: {
              conversationId: inboundConversationId,
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
              conversationId: inboundConversationId,
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
              conversationId: inboundConversationId,
              messageType: MessageType.FRAGMENT,
              fragmentMessageIds: [],
            },
          },
        })
        .set('Authorization', authorizationKeys);

      expect(nestedFragmentResponse.status).toEqual(201);
      const outboundConversationId = uuid();

      // ===============  when  ====================
      const patientRes = await request(app)
        .get(`/patients/${nhsNumber}`)
        .set('Authorization', authorizationKeys)
        .set('conversationId', outboundConversationId);

      // ===============  then  ====================
      expect(patientRes.status).toEqual(200);
      expect(patientRes.body.coreMessageUrl).toContain(
        `${config.localstackUrl}/${config.awsS3BucketName}/${inboundConversationId}/${coreMessageId}`
      );
      expect(patientRes.body.fragmentMessageIds).toHaveLength(2);
      expect(patientRes.body.fragmentMessageIds).toEqual(
        expect.arrayContaining([fragmentId, nestedFragmentId])
      );
      expect(patientRes.body.conversationIdFromEhrIn).toEqual(inboundConversationId);
      expectStructuredLogToContain(transportSpy, {
        conversationId: outboundConversationId,
        traceId: expect.anything(),
      });
    });

    it('should have conversation Id in the logging context', async () => {
      // given
      const outboundConversationId = uuid();
      const nhsNumber = '1234567890';

      // when
      await request(app)
        .get(`/patients/${nhsNumber}`)
        .set('Authorization', authorizationKeys)
        .set('conversationId', outboundConversationId);

      // then
      expectStructuredLogToContain(transportSpy, {
        conversationId: outboundConversationId,
        traceId: expect.anything(),
      });
    });

    it('should return a 404 if no complete health record is found', async () => {
      // given
      const inboundConversationId = uuid();
      const outboundConversationId = uuid();
      const coreMessageId = uuid();
      const fragmentId = uuid();
      const nhsNumber = '1234567891';

      // mimic the record at Conversation Layer, which should in actual case should be already created by ehr-transfer-service
      await createConversationForTest(inboundConversationId, nhsNumber, {
        TransferStatus: ConversationStatus.STARTED,
      });

      const messageResponse = await request(app)
        .post(`/messages`)
        .send({
          data: {
            id: coreMessageId,
            type: 'messages',
            attributes: {
              conversationId: inboundConversationId,
              messageType: MessageType.EHR_EXTRACT,
              nhsNumber,
              fragmentMessageIds: [fragmentId],
            },
          },
        })
        .set('Authorization', authorizationKeys);

      expect(messageResponse.status).toEqual(201);

      // when
      const response = await request(app)
        .get(`/patients/${nhsNumber}`)
        .set({ Authorization: authorizationKeys, conversationId: outboundConversationId });

      // then
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
    beforeEach(() => {
      messageId = uuid();
      conversationId = uuid();
      createConversationForTest(conversationId, nhsNumber, {
        TransferStatus: ConversationStatus.STARTED,
      });
    });

    afterEach(() => {
      cleanupRecordsForTest(conversationId);
    });

    afterAll(async () => {
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
      expect(conversation.TransferStatus).toBe(ConversationStatus.COMPLETE);
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

  describe('DELETE /patients/:nhsNumber', () => {
    // ======================= SETUP & HELPERS =======================
    const nhsNumber = '9000000001';
    const db = EhrTransferTracker.getInstance();
    const createCompleteRecord = async (
      nhsNumber,
      conversationId,
      coreMessageId,
      fragmentMessageIds = []
    ) => {
      await createConversationForTest(conversationId, nhsNumber, {
        TransferStatus: ConversationStatus.STARTED,
      });
      await request(app)
        .post(`/messages`)
        .send(createReqBodyForEhr(coreMessageId, conversationId, nhsNumber, fragmentMessageIds))
        .set('Authorization', authorizationKeys);
      await Promise.all(
        fragmentMessageIds.map((fragmentId) =>
          request(app)
            .post(`/messages`)
            .send(createReqBodyForFragment(fragmentId, conversationId))
            .set('Authorization', authorizationKeys)
        )
      );
    };

    const callGetPatient = (nhsNumber) => {
      return request(app).get(`/patients/${nhsNumber}`).set('Authorization', authorizationKeys);
    };

    afterEach(async () => {
      await cleanupRecordsForTestByNhsNumber(nhsNumber);
    });

    it('should mark the whole health record for the given NHS number as deleted', async () => {
      // ============================= given ==================================
      const inboundConversationId = uuid();
      const coreMessageId = uuid();
      const fragmentMessageIds = [uuid(), uuid(), uuid()];
      await createCompleteRecord(
        nhsNumber,
        inboundConversationId,
        coreMessageId,
        fragmentMessageIds
      );

      const getPatientResponse = await callGetPatient(nhsNumber);
      expect(getPatientResponse.status).toBe(200);
      expect(getPatientResponse.body).toMatchObject({
        conversationIdFromEhrIn: inboundConversationId,
        fragmentMessageIds: expect.arrayContaining(fragmentMessageIds),
      });
      const timestampBeforeDelete = Math.floor(new Date() / 1000);

      // ============================= when ==================================
      const deleteResponse = await request(app)
        .delete(`/patients/${nhsNumber}`)
        .set('Authorization', authorizationKeys);

      // ============================= then ==================================
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.data).toMatchObject({
        conversationIds: [inboundConversationId],
        id: nhsNumber,
      });

      const getPatientResponseAfterDeletion = await callGetPatient(nhsNumber);
      expect(getPatientResponseAfterDeletion.status).toBe(404);

      const softDeletedRecords = await db.queryTableByConversationId(
        inboundConversationId,
        RecordType.ALL,
        true
      );
      expect(softDeletedRecords).toHaveLength(5); // Conversation + Core + 3 Fragments

      const timestampAfterDelete = Math.ceil(new Date() / 1000);
      const eightWeeksInSeconds = 60 * 60 * 24 * 7 * 8;

      for (const item of softDeletedRecords) {
        expect(item).toMatchObject({
          InboundConversationId: inboundConversationId,
          DeletedAt: expect.any(Number),
        });
        expect(item.DeletedAt).toBeGreaterThanOrEqual(timestampBeforeDelete + eightWeeksInSeconds);
        expect(item.DeletedAt).toBeLessThanOrEqual(timestampAfterDelete + eightWeeksInSeconds);
      }
    });


    it('should delete all record if patient has more than one set of record in our storage', async () => {
      // given
      const inboundConversationId1 = uuid();
      const coreMessageId1 = uuid();
      const inboundConversationId2 = uuid();
      const coreMessageId2 = uuid();
      await createCompleteRecord(nhsNumber, inboundConversationId1, coreMessageId1);

      await new Promise(resolve => setTimeout(resolve, 1500)); // time buffer to ensure record 2 get a newer timestamp

      await createCompleteRecord(nhsNumber, inboundConversationId2, coreMessageId2);

      const getPatientResponse = await callGetPatient(nhsNumber);
      expect(getPatientResponse.status).toBe(200);
      expect(getPatientResponse.body).toMatchObject({
        conversationIdFromEhrIn: inboundConversationId2,
        fragmentMessageIds: [],
      });

      // when
      const deleteResponse = await request(app)
        .delete(`/patients/${nhsNumber}`)
        .set('Authorization', authorizationKeys);

      // then
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.data).toMatchObject({
        conversationIds: expect.arrayContaining([inboundConversationId1, inboundConversationId2]),
        id: nhsNumber,
      });

      const getPatientResponseAfterDeletion = await callGetPatient(nhsNumber);
      expect(getPatientResponseAfterDeletion.status).toBe(404);
    });
  });
});
