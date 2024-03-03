import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import moment from "moment";


export class EhrTransferTracker {
  constructor() {
    const baseClient = new DynamoDBClient({
      endpoint: "http://localhost:4573/"
    });

    this.tableName = "local-ehr-transfer-tracker";
    this.client = DynamoDBDocumentClient.from(baseClient);
  }

  async createCore(ehrExtract) {
    const { conversationId, messageId, nhsNumber } = ehrExtract;
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
      Layer: "Core",
      InboundMessageId: messageId,
      CreatedAt: timestamp,
      LastUpdatedAt: timestamp
    };

    const command = new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: this.tableName,
              Item: conversation
            }
          },
          {
            Put: {
              TableName: this.tableName,
              Item: core
            }
          }
        ]
      }
    );


    await this.client.send(command);
  }
}