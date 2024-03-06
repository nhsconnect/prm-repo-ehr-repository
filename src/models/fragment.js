import { getUKTimestamp } from '../services/time';
import { validate } from 'uuid';

const validateIds = (conversationId, messageId) => {
  const uuidsAreValid = validate(conversationId) && validate(messageId);
  if (!uuidsAreValid) {
    throw new Error('received invalid uuid as either conversationId or messageId');
  }
};

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

const FieldsAllowedToUpdate = {
  State: 'State',
  ParentId: 'ParentId',
  ReceivedAt: 'ReceivedAt',
  DeletedAt: 'DeletedAt',
};

export const buildFragmentUpdateParams = (conversationId, messageId, changes) => {
  validateIds(conversationId, messageId);

  const params = {
    Key: {
      InboundConversationId: conversationId,
      Layer: `Fragment#${messageId}`,
    },
    UpdateExpression: 'set CreatedAt = if_not_exists(CreatedAt, :now), UpdatedAt = :now',
    ExpressionAttributeValues: {
      ':now': getUKTimestamp(),
    },
  };

  for (const fieldname in FieldsAllowedToUpdate) {
    if (fieldname in changes) {
      const colonKey = `:${fieldname}`;
      params.UpdateExpression += `, ${fieldname} = ${colonKey}`;
      params.ExpressionAttributeValues[colonKey] = changes[fieldname];
    }
  }

  return params;
};
