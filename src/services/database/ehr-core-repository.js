import { EhrTransferTracker } from './dynamo-ehr-transfer-tracker';
import { arrayOfFragments, isFragment } from "../../models/fragment";
import { core, isCore } from "../../models/core";
import { RecordType } from '../../models/enums';
import { logError } from '../../middleware/logging';
import { MessageNotFoundError } from "../../errors/errors";

export const createCore = async ({ conversationId, messageId, fragmentMessageIds }) => {
  // to replace the existing `createEhrExtract` method

  try {
    const db = EhrTransferTracker.getInstance();
    const itemsToWrite = [core(conversationId, messageId)];

    if (fragmentMessageIds) {
      const directFragments = arrayOfFragments({
        inboundConversationId: conversationId,
        fragmentMessageIds,
        parentMessageId: messageId,
      });
      itemsToWrite.push(...directFragments);
    }

    await db.writeItemsToTable(itemsToWrite);
  } catch (e) {
    logError('Message could not be stored', e);
    throw e;
  }
};

export const getCoreByKey = (inboundConversationId, inboundMessageId) => {
  const db = EhrTransferTracker.getInstance();
  return db.getItemByKey(inboundConversationId, inboundMessageId, RecordType.CORE);
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
}
