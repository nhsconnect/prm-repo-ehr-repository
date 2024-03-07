import {
  TransactWriteCommand,
  QueryCommand,
  UpdateCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';

import { getUKTimestamp } from '../time';
import { logError, logInfo } from '../../middleware/logging';
import { RecordType, ConversationStatus } from '../../models/enums';
import { getDynamodbClient } from './dynamodb-client';
import { buildFragmentUpdateParams } from '../../models/fragment';

export class EhrTransferTracker {
  constructor() {
    if (EhrTransferTracker._instance) {
      throw new Error("Singleton classes can't be instantiated more than once.");
    }
    EhrTransferTracker._instance = this;

    this.tableName = process.env.DYNAMODB_NAME;

    const isInLocal = process.env.NHS_ENVIRONMENT === 'local' || !process.env.NHS_ENVIRONMENT;
    const isInDojo = process.env.DOJO_VERSION !== undefined;

    if (isInLocal && !isInDojo) {
      // for running individual test with IDE
      this.tableName = 'local-test-db';
    }

    this.client = getDynamodbClient();
  }

  static getInstance() {
    if (this._instance) {
      return this._instance;
    }
    return new this();
  }

  async writeItemsToTable(items) {
    if (!items || !Array.isArray(items)) {
      throw new Error('The given argument `items` is not an array');
    }
    const command = new TransactWriteCommand({
      TransactItems: items.map((item) => ({
        Put: {
          TableName: this.tableName,
          Item: item,
        },
      })),
    });

    await this.client.send(command);
  }

  async updateItemsInTransaction(updateParams) {
    if (!updateParams || !Array.isArray(updateParams)) {
      throw new Error('The given argument `updateParams` is not an array');
    }
    const command = new TransactWriteCommand({
      TransactItems: updateParams.map((params) => ({
        Update: {
          TableName: this.tableName,
          ...params,
        },
      })),
    });

    await this.client.send(command);
  }

  async queryTableByNhsNumber(nhsNumber) {
    const params = {
      TableName: this.tableName,
      IndexName: 'NhsNumberSecondaryIndex',
      ExpressionAttributeValues: {
        ':nhsNumber': nhsNumber,
      },
      ExpressionAttributeNames: {
        '#NhsNumber': 'NhsNumber',
      },
      KeyConditionExpression: '#NhsNumber = :nhsNumber',
    };

    const command = new QueryCommand(params);

    const response = await this.client.send(command);
    const items = response?.Items;
    if (!items) {
      logError('Received an empty response from dynamodb during query');
    }
    return items;
  }

  async queryTableByConversationId(
    inboundConversationId,
    recordType = RecordType.ALL,
    includeDeletedRecord = false
  ) {
    const params = {
      TableName: this.tableName,
      ExpressionAttributeNames: {
        '#PrimaryKey': 'InboundConversationId',
      },
      ExpressionAttributeValues: {
        ':InboundConversationId': inboundConversationId,
      },
      KeyConditionExpression: '#PrimaryKey = :InboundConversationId',
    };
    if (!includeDeletedRecord) {
      params.FilterExpression = 'attribute_not_exists(DeletedAt)';
    }

    switch (recordType) {
      case RecordType.ALL:
        break;
      case RecordType.CONVERSATION:
      case RecordType.CORE:
      case RecordType.FRAGMENT:
        params.ExpressionAttributeNames['#sortKey'] = 'Layer';
        params.ExpressionAttributeValues[':sortKey'] = recordType;
        params.KeyConditionExpression += ' AND begins_with(#sortKey, :sortKey)';
        break;
      default:
        logInfo(`Received unexpected queryType: ${recordType}. Will treat it as 'ALL'.`);
    }

    const command = new QueryCommand(params);

    const response = await this.client.send(command);
    const items = response?.Items;
    if (!items) {
      logError('Received an empty response from dynamodb during query');
      return [];
    }
    return items;
  }

  async getItemByKey(inboundConversationId, inboundMessageId, recordType = RecordType.FRAGMENT) {
    const expectedTypes = [RecordType.CORE, RecordType.FRAGMENT];

    if (!expectedTypes.includes(recordType)) {
      throw new Error('recordType has to be either Core or Fragment');
    }
    if (!inboundConversationId && !inboundMessageId) {
      throw new Error('must be called with both conversationId and inboundMessageId');
    }

    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        InboundConversationId: inboundConversationId,
        Layer: `${recordType}#${inboundMessageId}`,
      },
    });

    const response = await this.client.send(command);

    if (response?.Item) {
      logError('Received an empty response from dynamodb during query');
    }
    return response?.Item ?? null;
  }

  async getFragmentByKey(inboundConversationId, inboundMessageId) {
    return this.getItemByKey(inboundConversationId, inboundMessageId, RecordType.FRAGMENT);
  }
}
