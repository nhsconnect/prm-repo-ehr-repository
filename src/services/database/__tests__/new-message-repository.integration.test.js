import { v4 as uuid } from 'uuid';
import { logError } from '../../../middleware/logging';
// import * as time from '../../time';
import { createCore, getCoreByKey } from '../ehr-core-repository';
import {
  fragmentExists,
  getFragmentByKey,
  markFragmentAsReceivedAndCreateItsParts,
} from '../ehr-fragment-repository';
import { singleFragment } from '../../../models/fragment';
import { EhrTransferTracker } from '../dynamo-ehr-transfer-tracker';

// Mocking
jest.mock('../../../middleware/logging');

describe('messageRepository', () => {
  const expectedTimestamp = '2024-03-06T12:34:56+00:00';
  const mockTime = new Date(Date.parse(expectedTimestamp));

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(mockTime);
  });

  describe('createCore', () => {
    it('should create core message in db', async () => {
      // given
      const conversationId = uuid();
      const messageId = uuid();
      const ehrExtract = { messageId, conversationId, fragmentMessageIds: [] };

      // when
      await createCore(ehrExtract);

      // then
      const actualMessage = await getCoreByKey(conversationId, messageId);

      expect(actualMessage.InboundMessageId).toBe(messageId);
      expect(actualMessage.InboundConversationId).toBe(conversationId);
      expect(actualMessage.Layer).toBe(`Core#${messageId}`);
      expect(actualMessage.ReceivedAt).toEqual(expectedTimestamp);
    });

    // Note: old test it('should create health record in db') is not migrated,
    // as now the responsibility of creating a new conversation is handled by another service

    it('should create fragments message in db when health record has fragments', async () => {
      // given
      const conversationId = uuid();
      const messageId = uuid();
      const fragmentMessageId = uuid();
      const fragmentMessageIds = [fragmentMessageId];
      const ehrExtract = { messageId, conversationId, fragmentMessageIds };

      // when
      await createCore(ehrExtract);

      // then
      const fragmentMessage = await getFragmentByKey(conversationId, fragmentMessageId);
      expect(fragmentMessage.InboundConversationId).toBe(conversationId);
      expect(fragmentMessage.Layer).toBe(`Fragment#${fragmentMessageId}`);
      expect(fragmentMessage.InboundMessageId).toBe(fragmentMessageId);
      expect(fragmentMessage.ParentId).toBe(messageId);
      expect(fragmentMessage.ReceivedAt).toBeUndefined();
    });

    it('should not save message with wrong type', async () => {
      // given
      const conversationId = uuid();
      const messageId = 'not-a-valid-message-id';
      const ehrExtract = {
        messageId,
        conversationId,
        fragmentMessageIds: [],
      };

      try {
        // when
        await createCore(ehrExtract);
      } catch (err) {
        // then
        expect(err).not.toBeNull();
        expect(logError).toHaveBeenCalledWith('Message could not be stored', err);
      }
      const actualMessage = await getCoreByKey(conversationId, messageId);
      expect(actualMessage).toBeNull();
    });

    // Note: not migrating old test it('should not save message or health record with wrong nhs number'),
    // because now the nhs number field only present at conversation level.
  });

  describe('markFragmentAsReceivedAndCreateItsParts', () => {
    it('should update receivedAt for a fragment with current date', async () => {
      // given
      const conversationId = uuid();
      const ehrMessageId = uuid();
      const fragmentMessageId = uuid();
      await createCore({
        conversationId,
        messageId: ehrMessageId,
        fragmentMessageIds: [fragmentMessageId],
      });

      // when
      await markFragmentAsReceivedAndCreateItsParts(fragmentMessageId, conversationId, []);

      // then
      const fragment = await getFragmentByKey(conversationId, fragmentMessageId);
      expect(fragment.ReceivedAt).toEqual(expectedTimestamp);
    });

    it('should not update receivedAt for a given fragment if database update query throws', async () => {
      // given
      const conversationId = uuid();
      try {
        // when
        await markFragmentAsReceivedAndCreateItsParts('not-valid', conversationId, []);
      } catch (err) {
        // then
        expect(err).not.toBeNull();
        expect(logError).toHaveBeenCalledWith('Message could not be stored', err);
      }
    });

    it('should create messages for nested fragments', async () => {
      // given
      const conversationId = uuid();
      const ehrMessageId = uuid();
      const fragmentMessageId = uuid();
      const nestedFragmentMessageId = uuid();
      await createCore({
        conversationId,
        messageId: ehrMessageId,
        fragmentMessageIds: [fragmentMessageId],
      });

      // when
      await markFragmentAsReceivedAndCreateItsParts(fragmentMessageId, conversationId, [
        nestedFragmentMessageId,
      ]);

      // then
      const nestedFragmentMessage = await getFragmentByKey(conversationId, nestedFragmentMessageId);
      expect(nestedFragmentMessage.ReceivedAt).toEqual(undefined);
      expect(nestedFragmentMessage.ParentId).toEqual(fragmentMessageId);
      expect(nestedFragmentMessage.InboundConversationId).toEqual(conversationId);
    });

    it('should update parentId for a nested fragment already existing in the DB', async () => {
      // given
      const conversationId = uuid();
      const ehrMessageId = uuid();
      const fragmentMessageId = uuid();
      const nestedFragmentMessageId = uuid();

      await createCore({
        conversationId,
        messageId: ehrMessageId,
        fragmentMessageIds: [fragmentMessageId],
      });

      const nestedFragmentArrivedEarly = singleFragment({
        inboundConversationId: conversationId,
        fragmentMessageId: nestedFragmentMessageId,
      });
      const db = EhrTransferTracker.getInstance();
      await db.writeItemsToTable([nestedFragmentArrivedEarly]);

      // when
      await markFragmentAsReceivedAndCreateItsParts(fragmentMessageId, conversationId, [
        nestedFragmentMessageId,
      ]);

      // then
      const nestedFragmentMessage = await getFragmentByKey(conversationId, nestedFragmentMessageId);
      expect(nestedFragmentMessage.ParentId).toEqual(fragmentMessageId);
    });
  });

  describe('fragmentExists', () => {
    it('should return true for a fragment existing in the database', async () => {
      const conversationId = uuid();
      const messageId = uuid();

      const fragment = singleFragment({
        inboundConversationId: conversationId,
        fragmentMessageId: messageId,
      });
      const db = EhrTransferTracker.getInstance();
      await db.writeItemsToTable([fragment]);

      expect(await fragmentExists(conversationId, messageId)).toBe(true);
    });

    it('should return false for a fragment that does not exist in the database', async () => {
      const conversationId = uuid();
      const messageId = uuid();
      expect(await fragmentExists(conversationId, messageId)).toBe(false);
    });

    it('should throw if database querying throws', async () => {
      const messageId = 'not-valid';
      try {
        await fragmentExists(messageId);
      } catch (err) {
        expect(err).not.toBeNull();
        expect(logError).toHaveBeenCalledWith('Querying database for fragment message failed', err);
      }
    });
  });

  describe('markFragmentAsReceivedAndCreateItsParts', () => {
    // Note: this describe block is migrated from the test of old method "createFragmentPart"
    it('should create fragment entry in the database', async () => {
      const messageId = uuid();
      const conversationId = uuid();
      await markFragmentAsReceivedAndCreateItsParts(messageId, conversationId);

      const fragment = await getFragmentByKey(conversationId, messageId);

      expect(fragment.InboundConversationId).toEqual(conversationId);
      expect(fragment.ReceivedAt).toEqual(expectedTimestamp);
      expect(fragment.Layer).toEqual(`Fragment#${messageId}`);
      expect(fragment.ParentId).toBeUndefined();
    });

    it('should throw if database creation query throws', async () => {
      const conversationId = uuid();
      const messageId = 'not-valid';
      let err = null;
      try {
        await markFragmentAsReceivedAndCreateItsParts(messageId, conversationId);
      } catch (error) {
        err = error;
      }
      expect(err).not.toBeNull();
      expect(logError).toHaveBeenCalledWith('Message could not be stored', err);
    });
  });
});
