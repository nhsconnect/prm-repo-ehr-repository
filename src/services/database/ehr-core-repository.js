import { EhrTransferTracker } from "./dynamo-ehr-transfer-tracker";
import { arrayOfFragments } from "../../models/fragment";
import { core } from "../../models/core";

export const createCore = async ({ conversationId, messageId, fragmentMessageIds }) => {
  // to replace the existing `createEhrExtract` method

  const db = EhrTransferTracker.getInstance();
  const itemsToWrite = [core(conversationId, messageId)];

  if (fragmentMessageIds) {
    const directFragments = arrayOfFragments(
      {
        inboundConversationId: conversationId,
        fragmentMessageIds,
        parentMessageId: messageId
      }
    );
    itemsToWrite.push(...directFragments);
  }

  await db.writeItemsToTable(itemsToWrite);
};

