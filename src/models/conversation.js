import { getUKTimestamp } from '../services/time';
import { addChangesToUpdateParams } from '../utilities/dynamodb-helper';
import { ConversationStatus } from "./enums";

const fieldsAllowedToUpdate = ['TransferStatus', 'FailureCode', 'DeletedAt'];

export const buildConversationUpdateParams = (conversationId, changes) => {
  const baseParams = {
    Key: {
      InboundConversationId: conversationId,
      Layer: 'Conversation',
    },
    UpdateExpression: 'set UpdatedAt = :now',
    ExpressionAttributeValues: {
      ':now': getUKTimestamp(),
    },
  };

  return addChangesToUpdateParams(baseParams, changes, fieldsAllowedToUpdate);
};

export const isConversation = (item) => {
  return item.Layer === 'Conversation';
};

export const isInCompleteStatus = (conversation) => {
  const status = conversation?.TransferStatus;
  return status === ConversationStatus.COMPLETE || status?.startsWith('Outbound')
}