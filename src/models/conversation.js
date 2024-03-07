import { getUKTimestamp } from '../services/time';
import { logError } from '../middleware/logging';
import { addChangesToUpdateParams } from '../utilities/dynamodb-helper';

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
