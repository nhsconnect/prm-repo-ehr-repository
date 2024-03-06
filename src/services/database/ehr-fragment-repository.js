import { getUKTimestamp } from '../time';
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { EhrTransferTracker } from './dynamo-ehr-transfer-tracker';
import { buildFragmentUpdateParams } from '../../models/fragment';
import { QueryType } from '../../models/enums';
import { logError } from '../../middleware/logging';

export const markFragmentAsReceivedAndCreateItsParts = async (
  messageId,
  conversationId,
  remainingPartsIds = []
) => {
  // to replace the existing methods `updateFragmentAndCreateItsParts` and `createFragmentPart`

  try {
    const db = EhrTransferTracker.getInstance();
    const timestamp = getUKTimestamp();

    const currentFragmentParams = buildFragmentUpdateParams(conversationId, messageId, {
      ReceivedAt: timestamp,
    });

    const childFragmentsParams = remainingPartsIds.map((fragmentPartId) => {
      return buildFragmentUpdateParams(conversationId, fragmentPartId, { ParentId: messageId });
    });

    await db.updateItemsInTransaction([currentFragmentParams, ...childFragmentsParams]);
  } catch (e) {
    logError('Message could not be stored', e);
    throw e;
  }
};

export const getFragmentByKey = (inboundConversationId, inboundMessageId) => {
  // to replace the findByPk default method from sequalize
  const db = EhrTransferTracker.getInstance();
  return db.getItemByKey(inboundConversationId, inboundMessageId, QueryType.FRAGMENT);
};

export const fragmentExists = async (inboundConversationId, inboundMessageId) => {
  // to replace the method with same name
  try {
    const fragment = await getFragmentByKey(inboundConversationId, inboundMessageId);
    return !!fragment;
  } catch (e) {
    logError('Querying database for fragment message failed', e);
    throw e;
  }
};
