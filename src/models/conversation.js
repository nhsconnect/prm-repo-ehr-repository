import { getUKTimestamp } from '../services/time';
import { logError } from "../middleware/logging";

const fieldsAllowedToUpdate = ['State', 'FailureCode'];

export const buildConversationUpdateParams = (conversationId, changes) => {
  const params = {
    Key: {
      InboundConversationId: conversationId,
      Layer: 'Conversation',
    },
    UpdateExpression: 'set UpdatedAt = :now',
    ExpressionAttributeValues: {
      ':now': getUKTimestamp(),
    },
  };

  for (const [fieldName, updatedValue] of Object.entries(changes)) {
    if (fieldsAllowedToUpdate.includes(fieldName)) {
      const keyToken = `#${fieldName}`;
      const valueToken = `:${fieldName}`;

      params.UpdateExpression += `, ${keyToken} = ${valueToken}`;
      params.ExpressionAttributeValues[valueToken] = updatedValue;
      params.ExpressionAttributeNames = params.ExpressionAttributeNames ?? {};
      params.ExpressionAttributeNames[keyToken] = fieldName;
    } else {
      logError(`Ignoring attempt to update non-allowed field ${fieldName}`)
    }
  }

  return params;
};
