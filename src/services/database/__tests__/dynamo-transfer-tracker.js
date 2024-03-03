import { CreateTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { EhrTransferTracker } from "../dynamo-transfer-tracker";
import { v4 as uuid } from "uuid";

describe("test", () => {
  it("create a table in local dynamo", async () => {
    const db = new EhrTransferTracker();
    const ehrExtract = {
      conversationId: "test-conv-id",
      messageId: uuid(),
      nhsNumber: "9000000001"
    };
    await db.createCore(ehrExtract);
  });
});