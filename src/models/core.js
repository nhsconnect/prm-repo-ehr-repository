import { getUKTimestamp } from "../services/time";
import { CoreStates } from "./enums";

export const core = (inboundConversationId, messageId) => {
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