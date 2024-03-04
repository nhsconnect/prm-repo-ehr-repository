import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import moment from "moment";


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

    const isInLocal = process.env.nhsEnvironment === "local" || !process.env.nhsEnvironment;

    if (isInLocal) {
      clientConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
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
    // to replace the existing `createEhrExtract` method
    const { conversationId, messageId, nhsNumber, fragmentMessageIds } = ehrExtract;
    const timestamp = moment().toISOString();
    const conversation = {
      InboundConversationId: conversationId,
      Layer: "Conversation",
      NhsNumber: nhsNumber,
      CreatedAt: timestamp,
      LastUpdatedAt: timestamp
    };
    const core = {
      InboundConversationId: conversationId,
      Layer: `Core#${messageId}`,
      InboundMessageId: messageId,
      CreatedAt: timestamp,
      ReceivedAt: timestamp,
      LastUpdatedAt: timestamp
    };
    const fragments = fragmentMessageIds ? fragmentMessageIds.map(fragmentMessageId => {
      return {
        InboundConversationId: conversationId,
        Layer: `Fragment#${fragmentMessageId}`,
        InboundMessageId: fragmentMessageId,
        ParentId: messageId,
        CreatedAt: timestamp,
        LastUpdatedAt: timestamp
      };
    }) : [];

    const command = new TransactWriteCommand({
      TransactItems: [conversation, core, ...fragments].map((item) => ({
        Put: {
          TableName: this.tableName, Item: item, ConditionExpression: "attribute_not_exists(InboundConversationId)"
        }
      }))
    });

    await this.client.send(command);
  }

  async getCurrentHealthRecordIdForPatient(nhsNumber) {
    // to replace the existing method of the same name

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
      throw new Error("No records was found for given NHS number");
    }

    // TODO: to compare "completed at" rather then "created at"
    const currentRecord = items.reduce((prev, current) => {
      return (current && current?.CreatedAt > prev?.CreatedAt) ? current : prev;
    });

    return currentRecord.InboundConversationId;
  }
}