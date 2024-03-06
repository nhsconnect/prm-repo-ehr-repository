import { ConversationStates, HealthRecordStatus, QueryType } from '../../models/enums';
import { logError, logInfo } from '../../middleware/logging';
import { getUKTimestamp } from '../time';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { EhrTransferTracker } from './dynamo-ehr-transfer-tracker';
import { buildConversationUpdateParams } from '../../models/conversation';
import { HealthRecordNotFoundError } from '../../errors/errors';

export const getHealthRecordStatus = async (conversationId) => {
  // to replace the method with same name
  try {
    const conversation = await getConversationById(conversationId);
    if (conversation.State === ConversationStates.COMPLETE) {
      return HealthRecordStatus.COMPLETE;
    } else {
      return HealthRecordStatus.PENDING;
    }
  } catch (err) {
    if (err instanceof HealthRecordNotFoundError) {
      logInfo('No record was found for given conversationId');
      return HealthRecordStatus.NOT_FOUND;
    }

    logError('Health Record could not be retrieved from database', err);
    throw err;
  }
};

export const getConversationById = async (conversationId) => {
  const db = EhrTransferTracker.getInstance();

  const results = await db.queryTableByConversationId(conversationId, QueryType.CONVERSATION);
  if (!results || results.length === 0) {
    logInfo('Health Record not found');
    throw new HealthRecordNotFoundError();
  }
  logInfo('Health Record retrieved from the database');
  return results[0];
};

export const updateConversationCompleteness = async (conversationId) => {
  // to replace the existing method `updateHealthRecordCompleteness`

  try {
    const db = EhrTransferTracker.getInstance();

    const allFragments = await db.queryTableByConversationId(conversationId, QueryType.FRAGMENT);
    const pendingMessages = allFragments.filter((fragment) => fragment.ReceivedAt === undefined);

    if (pendingMessages.length !== 0) {
      logInfo(`${pendingMessages.length} more fragments to be received.`);
      return;
    }

    logInfo('All fragments are received. Will mark this inbound conversation as complete');

    const updateParam = buildConversationUpdateParams(conversationId, {
      State: ConversationStates.COMPLETE,
    });

    await db.updateItemsInTransaction([updateParam]);
  } catch (err) {
    logError('Failed to update health record completeness', err);
    throw err;
  }
};

export const getCurrentHealthRecordIdForPatient = async (nhsNumber) => {
  // to replace the existing method of the same name
  const db = EhrTransferTracker.getInstance();
  const conversations = await db.queryTableByNhsNumber(nhsNumber);

  const completedRecords = conversations?.filter(
    (item) => item.State === ConversationStates.COMPLETE || item.State.startsWith('Outbound')
  );

  if (!completedRecords || completedRecords.length === 0) {
    throw new HealthRecordNotFoundError();
  }

  const currentRecord = completedRecords.reduce((prev, current) => {
    return current?.CreatedAt > prev?.CreatedAt ? current : prev;
  });

  return currentRecord.InboundConversationId;
};
