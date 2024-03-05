import { EhrTransferTracker } from "../dynamo-ehr-transfer-tracker";
import { v4 as uuid } from "uuid";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { createConversationForTest } from "../../../models/conversation";

describe("EhrTransferTracker", () => {
  it("create and read an inbound conversation in dynamodb", async () => {
    // given
    const db = EhrTransferTracker.getInstance();
    const testConversationId = uuid();
    const testMessageId = uuid();
    const testNhsNumber = "9000000001";

    const ehrExtract = {
      conversationId: testConversationId,
      messageId: testMessageId,
      nhsNumber: testNhsNumber
    };

    // when
    await createConversationForTest(testConversationId, testNhsNumber);

    // await db.createCore(ehrExtract);

    const currentRecordId = await db.getCurrentHealthRecordIdForPatient(testNhsNumber);

    // then
    expect(currentRecordId).toEqual(testConversationId);
  });

  it("updateFragmentAndCreateItsParts", async () => {
    // given
    const db = EhrTransferTracker.getInstance();


    const testConversationId = uuid();
    const testMessageId = uuid();
    const testNhsNumber = "9000000002";
    const testChildMessageIds = [uuid(), uuid(), uuid()]

    const ehrExtract = {
      conversationId: testConversationId,
      messageId: testMessageId,
      nhsNumber: testNhsNumber,
      fragmentMessageIds: testChildMessageIds
    };

    await createConversationForTest(testConversationId, testNhsNumber);
    await db.createCore(ehrExtract)

    // when
    await db.updateFragmentAndCreateItsParts(testChildMessageIds[0], testConversationId)

    const records = await db.queryTableByConversationId(testConversationId);

    // then

    const expectedSize = 5; // Conversation + core + 3 children fragments
    expect(records).toHaveLength(expectedSize)

    const receivedFragment = records.filter(item => item.Layer.startsWith('Fragment') && item.ReceivedAt)
    expect(receivedFragment).toHaveLength(1)
    expect(receivedFragment[0].InboundMessageId).toEqual(testChildMessageIds[0])

    const nonReceivedFragments = records.filter(item => item.Layer.startsWith('Fragment') && !item.ReceivedAt)
    expect(nonReceivedFragments).toHaveLength(2)
  })
});