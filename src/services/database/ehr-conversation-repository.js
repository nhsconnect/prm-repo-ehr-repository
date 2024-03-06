import { ConversationStates, QueryType } from '../../models/enums';
import { logInfo } from '../../middleware/logging';
import { getUKTimestamp } from '../time';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { EhrTransferTracker } from './dynamo-ehr-transfer-tracker';
import { buildConversationUpdateParams } from '../../models/conversation';

export const updateInboundConversationCompleteness = async (conversationId) => {
  // to replace the existing method `updateHealthRecordCompleteness`
  const db = EhrTransferTracker.getInstance();

  const allFragments = this.queryTableByConversationId(conversationId, QueryType.FRAGMENT);
  const pendingMessages = allFragments.filter((fragment) => fragment.receivedAt === undefined);
  if (pendingMessages.length !== 0) {
    logInfo(`${pendingMessages.length} more fragments to be received.`);
    return;
  }

  logInfo('All fragments are received. Will mark this conversation as complete');

  const timestamp = getUKTimestamp();

  const updateParam = {
    TableName: this.tableName,
    Key: {
      InboundConversationId: conversationId,
      Layer: 'Conversation',
    },
    UpdateExpression: 'set UpdatedAt = :now, State = :complete',
    ExpressionAttributeValues: {
      ':now': timestamp,
      ':complete': ConversationStates.COMPLETE,
    },

    // TODO: try switch to below after integration test green
    // const updateParam = buildConversationUpdateParams(conversationId, {State: ConversationStates.COMPLETE})
  };

  await db.client.send(new UpdateCommand(updateParam));
};
