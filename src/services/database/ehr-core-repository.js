import { EhrTransferTracker } from "./dynamo-ehr-transfer-tracker";
import { arrayOfFragments } from "../../models/fragment";
import { core } from "../../models/core";
import { RecordType } from "../../models/enums";
import { logError } from "../../middleware/logging";

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

