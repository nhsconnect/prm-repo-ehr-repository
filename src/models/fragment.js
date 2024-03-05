import { getUKTimestamp } from "../services/time";



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

const FieldsAllowedToUpdate = {
  State: 'State',
  ParentId: 'ParentId',
  ReceivedAt: 'ReceivedAt',
  DeletedAt: 'DeletedAt'
}

export const fragmentUpdateParams = (conversationId, messageId, changes) => {
  const params = {
    Key: {
      InboundConversationId: conversationId,
      Layer: `Fragment#${messageId}`
    },
    UpdateExpression: "set CreatedAt = if_not_exists(CreatedAt, :now), UpdatedAt = :now",
    ExpressionAttributeValues: {
      ":now": getUKTimestamp()
    }
  };

  for (const fieldname in FieldsAllowedToUpdate) {
    if (fieldname in changes){
      const colonKey = `:${fieldname}`
      params.UpdateExpression += `, ${fieldname} = ${colonKey}`;
      params.ExpressionAttributeValues[colonKey] = changes[fieldname]
    }
  }

  return params;
}