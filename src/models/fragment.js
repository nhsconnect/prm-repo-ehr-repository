import { getUKTimestamp } from '../services/time';
import { validate } from 'uuid';
import { addChangesToUpdateParams, validateIds } from "../utilities/dynamodb-helper";

const fieldsAllowedToUpdate = ['TransferStatus', 'ParentId', 'ReceivedAt', 'DeletedAt'];

export const singleFragment = ({ inboundConversationId, fragmentMessageId, parentMessageId }) => {
  const timestamp = getUKTimestamp();

  validateIds(inboundConversationId, fragmentMessageId);

  return {
    InboundConversationId: inboundConversationId,
    Layer: `Fragment#${fragmentMessageId}`,
    InboundMessageId: fragmentMessageId,
    ParentId: parentMessageId,
    CreatedAt: timestamp,
    UpdatedAt: timestamp,
  };
};

export const arrayOfFragments = ({
  inboundConversationId,
  fragmentMessageIds,
  parentMessageId,
}) => {
  if (!fragmentMessageIds || !Array.isArray(fragmentMessageIds)) {
    return [];
  }
  return fragmentMessageIds.map((fragmentMessageId) =>
    singleFragment({ inboundConversationId, fragmentMessageId, parentMessageId })
  );
};

export const buildFragmentUpdateParams = (conversationId, messageId, changes) => {
  validateIds(conversationId, messageId);

  const params = {
    Key: {
      InboundConversationId: conversationId,
      Layer: `Fragment#${messageId}`,
    },
    UpdateExpression: `set CreatedAt = if_not_exists(CreatedAt, :now), \
      InboundMessageId = if_not_exists(InboundMessageId, :messageId), \
      UpdatedAt = :now`,
    ExpressionAttributeValues: {
      ':now': getUKTimestamp(),
      ':messageId': messageId,
    },
  };

  return addChangesToUpdateParams(params, changes, fieldsAllowedToUpdate);
};

export const isFragment = (dynamoDbItem) => {
  return dynamoDbItem?.Layer?.startsWith('Fragment');
};
