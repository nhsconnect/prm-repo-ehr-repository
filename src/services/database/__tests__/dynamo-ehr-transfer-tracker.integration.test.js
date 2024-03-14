import { EhrTransferTracker } from '../dynamo-ehr-transfer-tracker';
import { v4 as uuid } from 'uuid';
import { RecordType } from '../../../models/enums';
import {
  cleanupRecordsForTest,
  createConversationForTest,
} from '../../../utilities/integration-test-utilities';
import { buildCore } from '../../../models/core';

describe('EhrTransferTracker', () => {
  const testConversationId = uuid();
  const testNhsNumber = '9000000001';

  beforeEach(async () => {
    await createConversationForTest(testConversationId, testNhsNumber);
  });

  afterEach(async () => {
    await cleanupRecordsForTest(testConversationId);
  });

  it('can create and read a record in dynamodb', async () => {
    // given
    const db = EhrTransferTracker.getInstance();
    const testMessageId = uuid();

    const ehrCore = buildCore(testConversationId, testMessageId);

    await db.writeItemsInTransaction([ehrCore]);

    // then
    const actual = await db.queryTableByConversationId(testConversationId, RecordType.CORE);

    expect(actual).toHaveLength(1);
    expect(actual[0]).toMatchObject({
      InboundConversationId: testConversationId,
      InboundMessageId: testMessageId,
      Layer: RecordType.CORE,
      ReceivedAt: expect.any(String),
      CreatedAt: expect.any(String),
      UpdatedAt: expect.any(String),
    });
  });
});
