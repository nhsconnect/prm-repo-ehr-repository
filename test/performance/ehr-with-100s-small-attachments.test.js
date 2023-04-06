import { v4 } from 'uuid';
import axios from 'axios';
import adapter from 'axios/lib/adapters/http';

const headers = { Authorization: process.env.E2E_TEST_AUTHORIZATION_KEYS_FOR_EHR_REPO };

async function sendAttachment(id, conversationId, attachmentMessageIds) {
  const attachment = {
    data: {
      type: 'messages',
      id,
      attributes: {
        conversationId,
        messageType: 'attachment',
        attachmentMessageIds,
      },
    },
  };

  const response = await axios.post(`${process.env.SERVICE_URL}/messages`, attachment, {
    adapter,
    headers,
  });
  // Assert 201 for each attachment
  expect(response.status).toEqual(201);
}

async function sendEhrExtract(
  ehrExtractMessageId,
  conversationId,
  nhsNumber,
  ehrExtractAttachments
) {
  const ehrExtract = {
    data: {
      type: 'messages',
      id: ehrExtractMessageId,
      attributes: {
        conversationId,
        nhsNumber,
        messageType: 'ehrExtract',
        attachmentMessageIds: ehrExtractAttachments,
      },
    },
  };

  const ehrResponse = await axios.post(`${process.env.SERVICE_URL}/messages`, ehrExtract, {
    adapter,
    headers,
  });

  expect(ehrResponse.status).toEqual(201);
}

const timeAction = async (description, action) => {
  const before = new Date();
  await action();
  const after = new Date();

  // Assert it returns 201
  // Measure how long it took for ehr extract to be stored
  console.log(description, after - before, 'ms');
};

const testPerformance = async (
  smallAttachmentMessageIds,
  largeAttachmentId,
  partsOfLargeAttachment
) => {
  const ehrExtractMessageId = v4();
  const conversationId = v4();
  const nhsNumber = '1234567890';

  let ehrExtractAttachments = [...smallAttachmentMessageIds];
  if (largeAttachmentId) {
    ehrExtractAttachments = smallAttachmentMessageIds.concat([largeAttachmentId]);
  }

  await timeAction('Time taken to store health record extract: ', () =>
    sendEhrExtract(ehrExtractMessageId, conversationId, nhsNumber, ehrExtractAttachments)
  );

  await timeAction('Time taken to store all attachments: ', async () => {
    if (largeAttachmentId) {
      await sendAttachment(largeAttachmentId, conversationId, partsOfLargeAttachment);
    }

    const allSmallAttchments = smallAttachmentMessageIds.concat(partsOfLargeAttachment);

    for (const id of allSmallAttchments) {
      await sendAttachment(id, conversationId, []);
    }
  });

  // Retrieve ehr
  const retrieval = await axios.get(
    `${process.env.SERVICE_URL}/patients/${nhsNumber}/health-records/${conversationId}`,
    {
      headers,
      adapter,
    }
  );

  // Assert 200 and assert correct number of attachments
  expect(retrieval.status).toEqual(200);
};

describe('Performance of EHR', () => {
  it('Performance of EHR with 100 small attachments - within 60 seconds', async () => {
    //send ehr with 100 attachments to ehr repo -
    // POST /messages with type ehrExtract and 100 entries in the attachment list
    let attachmentMessageIds = [];

    const noOfAttachments = 100;
    for (let i = 0; i < noOfAttachments; i++) {
      attachmentMessageIds.push(v4());
    }

    await testPerformance(attachmentMessageIds, null, []);
  }, 60000);

  it('Performance of EHR with 50 attachments, one of which is large - within 25 seconds', async () => {
    // Send ehr with 50 attachments to store in EHR repo database
    let attachmentMessageIds = [];

    const noOfAttachments = 50;
    for (let i = 0; i < noOfAttachments; i++) {
      attachmentMessageIds.push(v4());
    }

    // Create one large attachment which is made up of 50 parts
    let largeAttachments = [];
    const noOfPartsOfVeryLargeAttachment = 50;
    const veryLargeAttachmentId = v4();
    for (let i = 0; i < noOfPartsOfVeryLargeAttachment - 1; i++) {
      largeAttachments.push(v4());
    }

    // Run test
    await testPerformance(attachmentMessageIds, veryLargeAttachmentId, largeAttachments);
  }, 25000);
});
