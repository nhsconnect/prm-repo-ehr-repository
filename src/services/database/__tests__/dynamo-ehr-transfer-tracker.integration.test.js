import { EhrTransferTracker } from "../dynamo-ehr-transfer-tracker";
import { v4 as uuid } from "uuid";
import { createConversationForTest, deleteConversationForTest } from "../../../models/conversation";

describe("EhrTransferTracker", () => {
  const testConversationId = uuid();
  const testNhsNumber = "9000000001";

  beforeEach(async () => {
    await createConversationForTest(testConversationId, testNhsNumber);
  });

  afterEach(async () => {
    await deleteConversationForTest(testConversationId);
  });

  it("create and read an ehrCore in dynamodb", async () => {
    // given
    const db = EhrTransferTracker.getInstance();
    const testMessageId = uuid();
    const testNhsNumber = "9000000001";

    const ehrExtract = {
      conversationId: testConversationId,
      messageId: testMessageId,
      nhsNumber: testNhsNumber
    };

    // when
    await db.createCore(ehrExtract);

    // then
    const records = await db.queryTableByConversationId(testConversationId);
    const actual = records.filter(item => item.Layer.startsWith("Core"));

    expect(actual).toHaveLength(1);
    expect(actual[0]).toMatchObject({
      InboundConversationId: testConversationId,
      InboundMessageId: testMessageId,
      Layer: `Core#${testMessageId}`,
      ReceivedAt: expect.any(String),
      CreatedAt: expect.any(String),
      UpdatedAt: expect.any(String)
    });
  });

  it("updateFragmentAndCreateItsParts", async () => {
    // given
    const db = EhrTransferTracker.getInstance();


    const testMessageId = uuid();
    const testNhsNumber = "9000000002";
    const testChildMessageIds = [uuid(), uuid(), uuid()];

    const ehrExtract = {
      conversationId: testConversationId,
      messageId: testMessageId,
      nhsNumber: testNhsNumber,
      fragmentMessageIds: testChildMessageIds
    };

    await db.createCore(ehrExtract);

    // when
    await db.updateFragmentAndCreateItsParts(testChildMessageIds[0], testConversationId);

    const records = await db.queryTableByConversationId(testConversationId);

    // then

    const expectedSize = 5; // Conversation + core + 3 children fragments
    expect(records).toHaveLength(expectedSize);

    const receivedFragment = records.filter(item => item.Layer.startsWith("Fragment") && item.ReceivedAt);
    expect(receivedFragment).toHaveLength(1);
    expect(receivedFragment[0].InboundMessageId).toEqual(testChildMessageIds[0]);

    const nonReceivedFragments = records.filter(item => item.Layer.startsWith("Fragment") && !item.ReceivedAt);
    expect(nonReceivedFragments).toHaveLength(2);
  });
});