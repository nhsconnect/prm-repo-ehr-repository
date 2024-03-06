import { v4 as uuidv4 } from 'uuid';
import { getUKTimestamp } from '../services/time';
import { EhrTransferTracker } from '../services/database/dynamo-ehr-transfer-tracker';
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';

export const generateRandomNhsNumber = () => (Math.floor(Math.random() * 9e9) + 1e9).toString();

export const generateRandomUUID = (isUppercase) =>
  isUppercase ? uuidv4().toUpperCase() : uuidv4();

export const generateMultipleUUID = (amount, isUppercase) =>
  Array(amount)
    .fill(undefined)
    .map(() => (isUppercase ? uuidv4().toUpperCase() : uuidv4()));

export const createConversationForTest = async (conversationId, nhsNumber) => {
  // This method is only meant for testing purpose,
  // as the inbound conversation record is supposed to be created by other service.

  const isInLocal = process.env.NHS_ENVIRONMENT === 'local' || !process.env.NHS_ENVIRONMENT;
  if (!isInLocal) {
    throw new Error('Unexpected call to createConversation method in non-local environment');
  }

  const timestamp = getUKTimestamp();
  const db = EhrTransferTracker.getInstance();

  const item = {
    InboundConversationId: conversationId,
    Layer: 'Conversation',
    NhsNumber: nhsNumber,
    CreatedAt: timestamp,
    UpdatedAt: timestamp,
  };

  await db.writeItemsToTable([item]);
};

export const cleanupRecordsForTest = async (conversationId) => {
  // This method is only meant for testing purpose

  const isInLocal = process.env.NHS_ENVIRONMENT === 'local' || !process.env.NHS_ENVIRONMENT;
  if (!isInLocal) {
    throw new Error('Unexpected call to createConversation method in non-local environment');
  }

  const db = EhrTransferTracker.getInstance();
  const records = await db.queryTableByConversationId(conversationId);
  const deleteCommand = new TransactWriteCommand({
    TransactItems: records.map((item) => ({
      Delete: {
        TableName: db.tableName,
        Key: {
          InboundConversationId: item.InboundConversationId,
          Layer: item.Layer,
        },
      },
    })),
  });

  await db.client.send(deleteCommand);
};
