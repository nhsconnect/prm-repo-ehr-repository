import { getUKTimestamp } from "../services/time";
import { EhrTransferTracker } from "../services/database/dynamo-ehr-transfer-tracker";



export const singleFragment = ({ inboundConversationId, fragmentMessageId, parentMessageId }) => {
  const timestamp = getUKTimestamp();
  return {
    InboundConversationId: inboundConversationId,
    Layer: `Fragment#${fragmentMessageId}`,
    InboundMessageId: fragmentMessageId,
    ParentId: parentMessageId,
    CreatedAt: timestamp,
    UpdatedAt: timestamp
  };
};

export const arrayOfFragments = ({ inboundConversationId, fragmentMessageIds, parentMessageId }) => {
  if (!fragmentMessageIds || !Array.isArray(fragmentMessageIds)) {
    return [];
  }
  return fragmentMessageIds.map(fragmentMessageId => singleFragment(
    { inboundConversationId, fragmentMessageId, parentMessageId }
  ));
};