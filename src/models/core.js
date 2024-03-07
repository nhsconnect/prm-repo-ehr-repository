import { getUKTimestamp } from '../services/time';
import { CoreStatus } from './enums';
import { validateIds } from '../utilities/dynamodb-helper';

export const buildCore = (inboundConversationId, messageId) => {
  const timestamp = getUKTimestamp();

  validateIds(inboundConversationId, messageId);

  return {
    InboundConversationId: inboundConversationId,
    Layer: `Core#${messageId}`,
    InboundMessageId: messageId,
    CreatedAt: timestamp,
    ReceivedAt: timestamp,
    UpdatedAt: timestamp,
    TransferStatus: CoreStatus.COMPLETE,
  };
};

export const isCore = (dynamoDbItem) => {
  return dynamoDbItem?.Layer?.startsWith('Core');
};
