import { ConversationStates, HealthRecordStatus, RecordType } from "../../models/enums";
import { logError, logInfo } from "../../middleware/logging";
import { EhrTransferTracker } from "./dynamo-ehr-transfer-tracker";
import { buildConversationUpdateParams } from "../../models/conversation";
import { HealthRecordNotFoundError, MessageNotFoundError } from "../../errors/errors";
import { isCore } from "../../models/core";
import { isFragment } from "../../models/fragment";

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

  const results = await db.queryTableByConversationId(conversationId, RecordType.CONVERSATION);
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

    const allFragments = await db.queryTableByConversationId(conversationId, RecordType.FRAGMENT);
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


export const getHealthRecordMessageIds = async (conversationId) => {
  // to replace the method of same name

  const db = EhrTransferTracker.getInstance();
  const items = await db.queryTableByConversationId(conversationId, RecordType.ALL);

  const core = items.filter(isCore)?.[0];
  const fragments = items.filter(isFragment);

  if (!core) {
    throw new MessageNotFoundError();
  }
  const coreMessageId = core.InboundMessageId;
  const fragmentMessageIds = fragments.map(message => message.InboundMessageId);

  return { coreMessageId, fragmentMessageIds };
};