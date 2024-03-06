import { getUKTimestamp } from "../services/time";

const fieldsAllowedToUpdate = ['State', 'FailureCode'];

export const buildConversationUpdateParams = (conversationId, changes) => {
  const params = {
    Key: {
      InboundConversationId: conversationId,
      Layer: 'Conversation'
    },
    UpdateExpression: "set UpdatedAt = :now",
    ExpressionAttributeValues: {
      ":now": getUKTimestamp()
    }
  };

  for (const fieldname in fieldsAllowedToUpdate) {
    if (fieldname in changes){
      const colonKey = `:${fieldname}`
      params.UpdateExpression += `, ${fieldname} = ${colonKey}`;
      params.ExpressionAttributeValues[colonKey] = changes[fieldname]
    }
  }

  return params;
}