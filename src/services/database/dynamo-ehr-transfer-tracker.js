import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

import { getUKTimestamp } from "../time";
import { logError } from "../../middleware/logging";


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
    const isInDojo = process.env.DOJO_VERSION !== undefined

    if (isInLocal) {
      clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
    }
    // for running individual test in IDE
    if (isInLocal && !isInDojo) {
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

    // TODO: to compare "completed at" rather then "created at"
    const currentRecord = items.reduce((prev, current) => {
      return (current && current?.CreatedAt > prev?.CreatedAt) ? current : prev;
    });

    return currentRecord.InboundConversationId;
  }

  async queryTableByConversationId(inboundConversationId) {
    const params = {
      TableName: this.tableName,
      ExpressionAttributeValues: {
        ":InboundConversationId": inboundConversationId
      },
      ExpressionAttributeNames: {
        "#InboundConversationId": "InboundConversationId"
      },
      KeyConditionExpression: "#InboundConversationId = :InboundConversationId"
    };

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
}