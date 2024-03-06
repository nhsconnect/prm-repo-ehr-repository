import { getUKTimestamp } from '../services/time';
import { CoreStates } from './enums';
import { validate } from 'uuid';

export const core = (inboundConversationId, messageId) => {
  const timestamp = getUKTimestamp();

  const uuidsAreValid = validate(inboundConversationId) && validate(messageId);
  if (!uuidsAreValid) {
    throw new Error('received invalid uuid as either conversationId or messageId');
  }

  return {
    InboundConversationId: inboundConversationId,
    Layer: `Core#${messageId}`,
    InboundMessageId: messageId,
    CreatedAt: timestamp,
    ReceivedAt: timestamp,
    UpdatedAt: timestamp,
    State: CoreStates.COMPLETE,
  };
};

export const isCore = (dynamoDbItem) => {
  return dynamoDbItem?.Layer?.startsWith('Core');
}
