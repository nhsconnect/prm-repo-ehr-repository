import { getUKTimestamp } from "../services/time";
import { EhrTransferTracker } from "../services/database/dynamo-ehr-transfer-tracker";
import { arrayOfFragments } from "./ehrFragment";
import { CoreStates } from "./enums";

export const createCore = async ({ conversationId, messageId, fragmentMessageIds }) => {
  // to replace the existing `createEhrExtract` method

  const db = EhrTransferTracker.getInstance();
  const itemsToWrite = [ehrCore(conversationId, messageId)];

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


export const ehrCore = (inboundConversationId, messageId) => {
  const timestamp = getUKTimestamp();
  return {
    InboundConversationId: inboundConversationId,
    Layer: `Core#${messageId}`,
    InboundMessageId: messageId,
    CreatedAt: timestamp,
    ReceivedAt: timestamp,
    UpdatedAt: timestamp,
    State: CoreStates.COMPLETE
  };
};