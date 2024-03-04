import { EhrTransferTracker } from "../dynamo-ehr-transfer-tracker";
import { v4 as uuid } from "uuid";

describe("EhrTransferTracker", () => {
  it("create and read an inbound conversation in dynamodb", async () => {
    const db = EhrTransferTracker.getInstance();
    const testConversationId = uuid();
    const testMessageId = uuid();
    const testNhsNumber = "9000000001";

    const ehrExtract = {
      conversationId: testConversationId,
      messageId: testMessageId,
      nhsNumber: testNhsNumber
    };
    await db.createCore(ehrExtract);

    const currentRecordId = await db.getCurrentHealthRecordIdForPatient(testNhsNumber);

    expect(currentRecordId).toEqual(testConversationId);
  });
});