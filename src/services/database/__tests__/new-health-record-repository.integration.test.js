import { v4 as uuid } from 'uuid';
import { logError } from '../../../middleware/logging';
import {
  getConversationById,
  getCurrentHealthRecordIdForPatient,
  getHealthRecordMessageIds,
  getHealthRecordStatus,
  markHealthRecordAsDeletedForPatient,
  updateConversationCompleteness,
} from '../ehr-conversation-repository';
import { ConversationStatus, HealthRecordStatus, RecordType } from '../../../models/enums';
import {
  cleanupRecordsForTest,
  createConversationForTest,
} from '../../../utilities/integration-test-utilities';
import { createCore } from '../ehr-core-repository';
import { EhrTransferTracker } from '../dynamo-ehr-transfer-tracker';
import {
  fragmentAlreadyReceived,
  markFragmentAsReceivedAndCreateItsParts,
} from '../ehr-fragment-repository';
import { HealthRecordNotFoundError, MessageNotFoundError } from '../../../errors/errors';
import { core } from '../../../models/core';
import { getEpochTimeInSecond } from '../../time';

jest.mock('../../../middleware/logging');

describe('healthRecordRepository', () => {
  // ========================= COMMON PROPERTIES =========================
  const db = EhrTransferTracker.getInstance();
  const markFragmentAsReceived = markFragmentAsReceivedAndCreateItsParts;
  const fail = (reason) => {
    throw new Error(reason);
  };
  const tableNameBackup = db.tableName;
  const mimicDynamodbFail = () => {
    db.tableName = 'non-exist-table';
  };
  const undoMimicDynamodbFail = () => {
    db.tableName = tableNameBackup;
  };
  // ========================= SET UP / TEAR DOWN ========================
  afterEach(() => {
    undoMimicDynamodbFail();
  });
  // =====================================================================

  describe('getHealthRecordStatus', () => {
    it("should return status 'complete' when conversation status is Complete", async () => {
      // given
      const conversationId = uuid();
      const nhsNumber = '1234567890';
      await createConversationForTest(conversationId, nhsNumber, {
        TransferStatus: ConversationStatus.COMPLETE,
      });

      // when
      const status = await getHealthRecordStatus(conversationId);

      // then
      expect(status).toEqual(HealthRecordStatus.COMPLETE);
    });

    it("should return status 'pending' when conversation status is not Complete", async () => {
      // given
      const conversationId = uuid();
      const nhsNumber = '1234567890';
      await createConversationForTest(conversationId, nhsNumber, {
        TransferStatus: ConversationStatus.CONTINUE_REQUEST_SENT,
      });

      // when
      const status = await getHealthRecordStatus(conversationId);

      // then
      expect(status).toEqual(HealthRecordStatus.PENDING);
    });

    it("should return status 'notFound' when health record is not found", async () => {
      // given
      const conversationId = uuid();

      // when
      const status = await getHealthRecordStatus(conversationId);

      // then
      expect(status).toEqual(HealthRecordStatus.NOT_FOUND);
    });

    it('should throw error if there is a problem retrieving health record from database', async () => {
      // given
      const conversationId = uuid();
      mimicDynamodbFail();

      try {
        // when
        await getHealthRecordStatus(conversationId);
        fail('should have throw');
      } catch (err) {
        // then
        expect(err).not.toBeNull();
        expect(logError).toHaveBeenCalledWith(
          'Health Record could not be retrieved from database',
          err
        );
      }
    });
  });

  describe('updateHealthRecordCompleteness', () => {
    it("should set conversation state to 'Complete' for a small health record", async () => {
      // given
      const conversationId = uuid();
      const messageId = uuid();
      const nhsNumber = '1234567890';
      await createConversationForTest(conversationId, nhsNumber, {
        TransferStatus: ConversationStatus.REQUEST_SENT,
      });
      await createCore({ conversationId, messageId, fragmentMessageIds: [] });

      // when
      await updateConversationCompleteness(conversationId);

      // then
      const conversation = await getConversationById(conversationId);

      expect(conversation.TransferStatus).toBe(ConversationStatus.COMPLETE);
    });

    it('should not set State to Complete if there are still messages to be received', async () => {
      // given
      const conversationId = uuid();
      const messageId = uuid();
      const fragmentMessageId = uuid();
      const nhsNumber = '1234567890';

      await createConversationForTest(conversationId, nhsNumber, {
        TransferStatus: ConversationStatus.CONTINUE_REQUEST_SENT,
      });
      await createCore({ conversationId, messageId, fragmentMessageIds: [fragmentMessageId] });

      // when
      await updateConversationCompleteness(conversationId);

      // then
      const conversation = await getConversationById(conversationId);

      expect(conversation.TransferStatus).toBe(ConversationStatus.CONTINUE_REQUEST_SENT);
    });

    it('Should set State to Complete if all fragments are received', async () => {
      // given
      const conversationId = uuid();
      const messageId = uuid();
      const fragmentMessageIds = [uuid(), uuid(), uuid()];
      const nhsNumber = '1234567890';

      await createConversationForTest(conversationId, nhsNumber, {
        TransferStatus: ConversationStatus.CONTINUE_REQUEST_SENT,
      });
      await createCore({ conversationId, messageId, fragmentMessageIds: fragmentMessageIds });
      for (const fragmentId of fragmentMessageIds) {
        await markFragmentAsReceived(fragmentId, conversationId);
      }

      // when
      await updateConversationCompleteness(conversationId);

      // then
      const conversation = await getConversationById(conversationId);

      expect(conversation.TransferStatus).toBe(ConversationStatus.COMPLETE);
    });

    it('should throw an error when database query fails', async () => {
      // given
      const conversationId = 'not-valid';
      mimicDynamodbFail();

      try {
        // when
        await updateConversationCompleteness(conversationId);
        fail('should have throw');
      } catch (err) {
        // then
        expect(err).not.toBeNull();
        expect(logError).toHaveBeenCalledWith('Failed to update health record completeness', err);
      }
    });
  });

  describe('getCurrentHealthRecordIdForPatient', () => {
    it('should return most recent complete health record conversation id', async () => {
      // given
      const nhsNumber = '9876543212';
      const previousHealthRecordConversationId = uuid();
      const incompleteHealthRecordConversationId = uuid();
      const currentHealthRecordConversationId = uuid();

      await createConversationForTest(previousHealthRecordConversationId, nhsNumber, {
        TransferStatus: ConversationStatus.COMPLETE,
        CreatedAt: '2024-01-01T10:00:00+00:00',
      });

      await createConversationForTest(incompleteHealthRecordConversationId, nhsNumber, {
        TransferStatus: ConversationStatus.TIMEOUT,
      });

      await createConversationForTest(currentHealthRecordConversationId, nhsNumber, {
        TransferStatus: ConversationStatus.COMPLETE,
      });

      // when
      const actual = await getCurrentHealthRecordIdForPatient(nhsNumber);

      // then
      expect(actual).toEqual(currentHealthRecordConversationId);
    });

    it('should throw an error if no complete health record is found', async () => {
      // given
      const nhsNumber = '9876543211';
      const incompleteHealthRecordConversationId = uuid();
      await createConversationForTest(incompleteHealthRecordConversationId, nhsNumber, {
        TransferStatus: ConversationStatus.TIMEOUT,
      });

      // when
      await expect(() => getCurrentHealthRecordIdForPatient(nhsNumber))
        // then
        .rejects.toThrowError(HealthRecordNotFoundError);
    });

    it('should throw an error when cannot find any health record', async () => {
      // given
      const nhsNumber = '1111111112';

      // when
      await expect(() => getCurrentHealthRecordIdForPatient(nhsNumber))
        // then
        .rejects.toThrowError(HealthRecordNotFoundError);
    });
  });

  describe('getHealthRecordMessageIds', () => {
    it('should throw an error if no message found with given conversationId', async () => {
      // given
      const conversationId = uuid();

      // when
      await expect(() => getHealthRecordMessageIds(conversationId))
        // then
        .rejects.toThrowError(MessageNotFoundError);
    });

    it('should throw an error if the only existing messages were deleted', async () => {
      // given
      const conversationId = uuid();
      const messageId = uuid();
      const item = { ...core(conversationId, messageId), DeletedAt: getEpochTimeInSecond() };

      await db.writeItemsToTable([item]);

      // when
      await expect(() => getHealthRecordMessageIds(conversationId))
        // then
        .rejects.toThrowError(MessageNotFoundError);
    });

    it('should return health record extract message id given a conversation id for a small health record', async () => {
      // given
      const messageId = uuid();
      const conversationId = uuid();
      await createCore({ conversationId, messageId, fragmentMessageIds: [] });

      // when
      const { coreMessageId, fragmentMessageIds } = await getHealthRecordMessageIds(conversationId);

      // then
      expect(coreMessageId).toEqual(messageId);
      expect(fragmentMessageIds).toEqual([]);
    });

    it('should return health record extract message id and fragment message ids given singular fragment', async () => {
      // given
      const messageId = uuid();
      const conversationId = uuid();
      const fragmentMessageId = uuid();

      await createCore({ conversationId, messageId, fragmentMessageIds: [fragmentMessageId] });
      await markFragmentAsReceived(fragmentMessageId, conversationId);

      // when
      const { coreMessageId, fragmentMessageIds } = await getHealthRecordMessageIds(conversationId);

      // then
      expect(coreMessageId).toEqual(messageId);
      expect(fragmentMessageIds).toEqual([fragmentMessageId]);
    });

    it('should return health record extract message id and fragment message ids given nested fragments', async () => {
      // given
      const messageId = uuid();
      const conversationId = uuid();
      const fragmentMessageId = uuid();
      const nestedFragmentId = uuid();

      await createCore({ conversationId, messageId, fragmentMessageIds: [fragmentMessageId] });
      await markFragmentAsReceivedAndCreateItsParts(fragmentMessageId, conversationId, [
        nestedFragmentId,
      ]);
      await markFragmentAsReceived(nestedFragmentId, conversationId);

      // when
      const { coreMessageId, fragmentMessageIds } = await getHealthRecordMessageIds(conversationId);

      // then
      expect(coreMessageId).toEqual(messageId);
      expect(fragmentMessageIds.sort()).toEqual([fragmentMessageId, nestedFragmentId].sort());
    });
  });

  describe('fragmentAlreadyReceived', () => {
    it("should return false if 'messageId' is not found in db", async () => {
      // given
      const messageId = uuid();

      // when
      const result = await fragmentAlreadyReceived(messageId);

      // then
      expect(result).toEqual(false);
    });

    it("should return true if 'messageId' is received in db", async () => {
      // given
      const conversationId = uuid();
      const messageId = uuid();
      const fragmentMessageId = uuid();

      await createCore({ conversationId, messageId, fragmentMessageIds: [fragmentMessageId] });
      await markFragmentAsReceived(fragmentMessageId, conversationId);

      // when
      const result = await fragmentAlreadyReceived(conversationId, fragmentMessageId);

      // then
      expect(result).toEqual(true);
    });

    it('should throw if database querying throws', async () => {
      // given
      const messageId = uuid();
      mimicDynamodbFail();

      // when
      try {
        await fragmentAlreadyReceived(messageId);
        fail('should have throw');
      } catch (err) {
        // then
        expect(err).not.toBeNull();
        expect(logError).toHaveBeenCalledWith('Querying database for fragment message failed', err);
      }
    });
  });

  describe('markHealthRecordAsDeletedForPatient', () => {
    // HELPER SETUPS
    let conversationIdUsed = [];
    const mockTime = new Date(Date.parse('2024-03-06T12:34:56+00:00'));
    const mockTimeInEpochSecond = mockTime / 1000;

    beforeEach(async () => {
      jest.useFakeTimers().setSystemTime(mockTime);
    });

    afterEach(async () => {
      await Promise.all(conversationIdUsed.map(cleanupRecordsForTest));
      conversationIdUsed = [];
    });

    const makeConversationIdForTest = () => {
      const id = uuid();
      conversationIdUsed.push(id);
      return id;
    };

    const createCompleteRecordForTest = async (
      nhsNumber,
      conversationId,
      messageId,
      fragmentMessageIds = []
    ) => {
      await createConversationForTest(conversationId, nhsNumber, {
        TransferStatus: ConversationStatus.COMPLETE,
      });
      await createCore({ conversationId, messageId, fragmentMessageIds });
      for (const fragmentMessageId of fragmentMessageIds) {
        await markFragmentAsReceived(fragmentMessageId, conversationId);
      }
    };

    // TESTS START FROM HERE

    it('should return conversation id for the patient marked as deleted', async () => {
      // given
      const nhsNumber = '9898989898';
      const messageId = uuid();
      const conversationId = makeConversationIdForTest();
      const fragmentIds = [uuid(), uuid(), uuid()];

      await createCompleteRecordForTest(nhsNumber, conversationId, messageId, fragmentIds);

      // when
      const result = await markHealthRecordAsDeletedForPatient(nhsNumber);

      // then

      const healthRecordStatusAfterwards = await getHealthRecordStatus(conversationId);
      expect(result).toEqual([conversationId]);
      expect(healthRecordStatusAfterwards).toEqual(HealthRecordStatus.NOT_FOUND);

      const deletedRecords = await db.queryTableByConversationId(
        conversationId,
        RecordType.ALL,
        true
      );
      expect(deletedRecords).toHaveLength(5); // conversation + core + 3 fragments

      for (const item of deletedRecords) {
        expect(item).toMatchObject({
          InboundConversationId: conversationId,
          DeletedAt: mockTimeInEpochSecond,
        });
      }
    });

    it('should return conversation ids for the patient marked as deleted when the patient has several health records', async () => {
      // given
      const nhsNumber = '6767676767';
      const firstMessageId = uuid();
      const secondMessageId = uuid();
      const firstConversationId = makeConversationIdForTest();
      const secondConversationId = makeConversationIdForTest();

      await createCompleteRecordForTest(nhsNumber, firstConversationId, firstMessageId);
      await createCompleteRecordForTest(nhsNumber, secondConversationId, secondMessageId);

      // when
      const result = await markHealthRecordAsDeletedForPatient(nhsNumber);

      // then
      expect(result).toHaveLength(2);
      expect(result.sort()).toEqual([firstConversationId, secondConversationId].sort());

      const deletedRecords = (
        await Promise.all(
          result.map((conversationId) =>
            db.queryTableByConversationId(conversationId, RecordType.ALL, true)
          )
        )
      ).flat();

      expect(deletedRecords).toHaveLength(4); // two sets of conversation + core

      for (const item of deletedRecords) {
        expect(item).toMatchObject({
          DeletedAt: mockTimeInEpochSecond,
        });
      }
    });
  });
});