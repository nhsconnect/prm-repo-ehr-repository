import { EhrTransferTracker } from '../dynamo-ehr-transfer-tracker';
import { v4 as uuid } from 'uuid';
import { RecordType } from '../../../models/enums';
import { createCore } from '../ehr-core-repository';
import {
  cleanupRecordsForTest,
  createConversationForTest,
} from '../../../utilities/integration-test-utilities';
import { markFragmentAsReceivedAndCreateItsParts } from '../ehr-fragment-repository';
import { core } from '../../../models/core';

describe('EhrTransferTracker', () => {
  const testConversationId = uuid();
  const testNhsNumber = '9000000001';

  beforeEach(async () => {
    await createConversationForTest(testConversationId, testNhsNumber);
  });

  afterEach(async () => {
    await cleanupRecordsForTest(testConversationId);
  });

  it('create and read an ehrCore in dynamodb', async () => {
    // given
    const db = EhrTransferTracker.getInstance();
    const testMessageId = uuid();

    const ehrCore = core(testConversationId, testMessageId);

    await db.writeItemsToTable([ehrCore]);

    // then
    const actual = await db.queryTableByConversationId(testConversationId, RecordType.CORE);

    expect(actual).toHaveLength(1);
    expect(actual[0]).toMatchObject({
      InboundConversationId: testConversationId,
      InboundMessageId: testMessageId,
      Layer: `Core#${testMessageId}`,
      ReceivedAt: expect.any(String),
      CreatedAt: expect.any(String),
      UpdatedAt: expect.any(String),
    });
  });
});
