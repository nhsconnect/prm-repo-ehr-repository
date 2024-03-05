import { getUKTimestamp } from "../services/time";
import { EhrTransferTracker } from "../services/database/dynamo-ehr-transfer-tracker";
import { arrayOfFragments } from "./ehrFragment";

export const createCore = async ({ inboundConversationId, messageId, fragmentMessageIds }) => {
  // to replace the existing `createEhrExtract` method

  const db = EhrTransferTracker.getInstance();
  const itemsToWrite = [ehrCore({ inboundConversationId, messageId })];

  if (fragmentMessageIds) {
    const directFragments = arrayOfFragments(
      {
        inboundConversationId,
        fragmentMessageIds,
        parentMessageId: messageId
      }
    );
    itemsToWrite.push(...directFragments);
  }

  await db.writeItemsToTable(itemsToWrite);
};


export const ehrCore = ({ inboundConversationId, messageId }) => {
  const timestamp = getUKTimestamp();
  return {
    InboundConversationId: inboundConversationId,
    Layer: `Core#${messageId}`,
    InboundMessageId: messageId,
    CreatedAt: timestamp,
    ReceivedAt: timestamp,
    UpdatedAt: timestamp
  };
};