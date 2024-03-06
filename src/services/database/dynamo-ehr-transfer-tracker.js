import { TransactWriteCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import { getUKTimestamp } from "../time";
import { logError, logInfo } from "../../middleware/logging";
import { QueryType, ConversationStates } from "../../models/enums";
import { getDynamodbClient } from "./dynamodb-client";
import { fragmentUpdateParams } from "../../models/fragment";


export class EhrTransferTracker {
  constructor() {
    if (EhrTransferTracker._instance) {
      throw new Error("Singleton classes can't be instantiated more than once.");
    }
    EhrTransferTracker._instance = this;

    this.tableName = process.env.DYNAMODB_NAME;

    const isInLocal = process.env.NHS_ENVIRONMENT === "local" || !process.env.NHS_ENVIRONMENT;
    const isInDojo = process.env.DOJO_VERSION !== undefined;

    if (isInLocal && !isInDojo) {
      // for running individual test with IDE
      this.tableName = "local-test-db";
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

  async updateItemsInTransaction(updateParams) {
    if (!updateParams || !Array.isArray(updateParams)) {
      throw new Error("The given argument `updateParams` is not an array");
    }
    const command = new TransactWriteCommand({
      TransactItems: updateParams.map((params) => ({
        Update: {
          TableName: this.tableName, ...params
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

    const completedRecords = items.filter(item => item.State === ConversationStates.COMPLETE || item.State.startsWith("Outbound"));

    const currentRecord = completedRecords.reduce((prev, current) => {
      return (current && current?.CreatedAt > prev?.CreatedAt) ? current : prev;
    });

    return currentRecord.InboundConversationId;
  }

  async queryTableByConversationId(inboundConversationId, queryType = QueryType.ALL) {
    const params = {
      TableName: this.tableName,
      ExpressionAttributeNames: {
        "#PrimaryKey": "InboundConversationId"
      },
      ExpressionAttributeValues: {
        ":InboundConversationId": inboundConversationId
      },
      KeyConditionExpression: "#PrimaryKey = :InboundConversationId"
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
                                        remainingPartsIds = []) {
    // to replace the existing methods `updateFragmentAndCreateItsParts` and `createFragmentPart`
    const timestamp = getUKTimestamp();

    const currentFragmentParams = fragmentUpdateParams(conversationId, messageId, { ReceivedAt: timestamp });

    const childFragmentsParams = remainingPartsIds.map(fragmentPartId => {
      return fragmentUpdateParams(
        conversationId,
        fragmentPartId,
        { ParentId: messageId }
      );
    });

    await this.updateItemsInTransaction([currentFragmentParams, ...childFragmentsParams]);
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