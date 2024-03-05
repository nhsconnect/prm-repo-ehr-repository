import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import { getUKTimestamp } from "../time";
import { logError, logInfo } from "../../middleware/logging";
import { QueryType, ConversationStates } from "../../models/enums";


export class EhrTransferTracker {
  constructor() {
    if (EhrTransferTracker._instance) {
      throw new Error("Singleton classes can't be instantiated more than once.");
    }
    EhrTransferTracker._instance = this;

    this.tableName = process.env.DYNAMODB_NAME;

    const clientConfig = {
      region: process.env.AWS_DEFAULT_REGION ?? "eu-west-2"
    };

    const isInLocal = process.env.NHS_ENVIRONMENT === "local" || !process.env.NHS_ENVIRONMENT;
    const isInDojo = process.env.DOJO_VERSION !== undefined;

    if (isInLocal) {
      // for running whole integration test suite in dojo
      clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
    }
    if (isInLocal && !isInDojo) {
      // for running individual test with IDE
      clientConfig.endpoint = "http://localhost:4573";
      this.tableName = "local-test-db";
    }

    const baseClient = new DynamoDBClient(clientConfig);
    this.client = DynamoDBDocumentClient.from(baseClient);
  }

  static getInstance() {
    if (this._instance) {
      return this._instance;
    }
    return new this();
  }

  async createCore(ehrExtract) {

    const { conversationId, messageId, nhsNumber, fragmentMessageIds } = ehrExtract;
    const timestamp = getUKTimestamp();

    const core = {
      InboundConversationId: conversationId,
      Layer: `Core#${messageId}`,
      InboundMessageId: messageId,
      CreatedAt: timestamp,
      ReceivedAt: timestamp,
      UpdatedAt: timestamp
    };
    const fragments = fragmentMessageIds ? fragmentMessageIds.map(fragmentMessageId => {
      return {
        InboundConversationId: conversationId,
        Layer: `Fragment#${fragmentMessageId}`,
        InboundMessageId: fragmentMessageId,
        ParentId: messageId,
        CreatedAt: timestamp,
        UpdatedAt: timestamp
      };
    }) : [];

    const itemsToWrite = [core, ...fragments];

    await this.writeItemsToTable(itemsToWrite);
  }

  async writeItemsToTable(items) {
    if (!items || !Array.isArray(items)) {
      throw new Error("The given argument `items` is not an array");
    }
    const command = new TransactWriteCommand({
      TransactItems: items.map((item) => ({
        Put: {
          TableName: this.tableName, Item: item
        }
      }))
    });

    await this.client.send(command);
  }

  async queryTableByNhsNumber(nhsNumber) {
    const params = {
      TableName: this.tableName,
      IndexName: "NhsNumberSecondaryIndex",
      ExpressionAttributeValues: {
        ":nhsNumber": nhsNumber
      },
      ExpressionAttributeNames: {
        "#NhsNumber": "NhsNumber"
      },
      KeyConditionExpression: "#NhsNumber = :nhsNumber"
    };

    const command = new QueryCommand(params);

    const response = await this.client.send(command);
    const items = response?.Items;
    if (!items) {
      logError("Received an empty response from dynamodb during query");
    }
    return items;
  }

  async getCurrentHealthRecordIdForPatient(nhsNumber) {
    // to replace the existing method of the same name

    const items = await this.queryTableByNhsNumber(nhsNumber);

    if (!items || items.length === 0) {
      throw new Error("No record was found for given NHS number");
    }

    const completedRecords = items.filter(item => item.State === ConversationStates.COMPLETE || item.State.startsWith('Outbound'));

    const currentRecord = completedRecords.reduce((prev, current) => {
      return (current && current?.UpdatedAt > prev?.UpdatedAt) ? current : prev;
    });

    return currentRecord.InboundConversationId;
  }

  async queryTableByConversationId(inboundConversationId, queryType = QueryType.ALL) {
    const params = {
      TableName: this.tableName,
      ExpressionAttributeNames: {
        "#InboundConversationId": "InboundConversationId"
      },
      ExpressionAttributeValues: {
        ":InboundConversationId": inboundConversationId
      },
      KeyConditionExpression: "#InboundConversationId = :InboundConversationId"
    };

    switch (queryType) {
      case QueryType.ALL:
        break;
      case QueryType.CONVERSATION:
      case QueryType.CORE:
      case QueryType.FRAGMENT:
        params.ExpressionAttributeNames["#sortKey"] = "Layer";
        params.ExpressionAttributeValues[":sortKey"] = queryType;
        params.KeyConditionExpression += " AND begins_with(#sortKey, :sortKey)";
        break;
      default:
        logInfo(`Received unexpected queryType: ${queryType}. Will treat it as 'ALL'.`);
    }

    const command = new QueryCommand(params);

    const response = await this.client.send(command);
    const items = response?.Items;
    if (!items) {
      logError("Received an empty response from dynamodb during query");
    }
    return items;
  }

  async updateFragmentAndCreateItsParts(messageId,
                                        conversationId,
                                        remainingPartsIds) {
    // to replace the existing methods `updateFragmentAndCreateItsParts` and `createFragmentPart`
    const timestamp = getUKTimestamp();

    const currentFragment = {
      TableName: this.tableName,
      Key: {
        InboundConversationId: conversationId,
        Layer: `Fragment#${messageId}`
      },
      UpdateExpression: "set ReceivedAt = :now, CreatedAt = if_not_exists(CreatedAt, :now), UpdatedAt = :now",
      ExpressionAttributeValues: {
        ":now": timestamp
      }
    };

    const childFragments = remainingPartsIds ? remainingPartsIds.map(fragmentPartId => {
      return ({
        TableName: this.tableName,
        Key: {
          InboundConversationId: conversationId,
          Layer: `Fragment#${fragmentPartId}`
        },
        UpdateExpression: "set CreatedAt = if_not_exists(CreatedAt, :now), UpdatedAt = :now, ParentId = :parentMessageId",
        ExpressionAttributeValues: {
          ":now": timestamp,
          ":parentMessageId": messageId
        }
      });
    }) : [];

    const updateParams = [currentFragment, ...childFragments];
    const command = new TransactWriteCommand({
      TransactItems: updateParams.map((param) => ({
        Update: param
      }))
    });
    await this.client.send(command);
  };

  async updateHealthRecordCompleteness(conversationId) {
    const allFragments = this.queryTableByConversationId(conversationId, QueryType.FRAGMENT);
    const pendingMessages = allFragments.filter(fragment => fragment.receivedAt === undefined);
    if (pendingMessages.length !== 0) {
      logInfo(`${pendingMessages.length} more fragments to be received.`);
      return;
    }

    logInfo("All fragments are received. Will mark this conversation as complete");

    const timestamp = getUKTimestamp();
    const updateParam = {
      TableName: this.tableName,
      Key: {
        InboundConversationId: conversationId,
        Layer: "Conversation"
      },
      UpdateExpression: "set UpdatedAt = :now, State = :complete",
      ExpressionAttributeValues: {
        ":now": timestamp,
        ":complete": ConversationStates.COMPLETE
      }
    };

    await this.client.send(new UpdateCommand(updateParam));
  }
}