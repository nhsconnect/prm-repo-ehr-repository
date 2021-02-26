import { v4 } from 'uuid';
import axios from 'axios';
import adapter from 'axios/lib/adapters/http';

describe('Performance of EHR with hundreds of small attachements', () => {
  it('should save everything within 10 seconds', async () => {
    //send ehr with 100 attachements to ehr repo - POST /messages with type ehrExtract and 100
    //entries in the attachement list
    const ehrExtractMessageId = v4();
    const conversationId = v4();
    const nhsNumber = '1234567890';
    let attachmentMessageIds = [];

    const noOfAttachments = 100;
    for (let i = 0; i < noOfAttachments; i++) {
      attachmentMessageIds.push(v4());
    }

    const ehrExtract = {
      data: {
        type: 'messages',
        id: ehrExtractMessageId,
        attributes: {
          conversationId,
          nhsNumber,
          messageType: 'ehrExtract',
          attachmentMessageIds
        }
      }
    };

    const headers = { Authorization: process.env.AUTHORIZATION_KEYS };

    console.log(`${process.env.SERVICE_URL}/messages`);
    const before = new Date();
    const response = await axios.post(`${process.env.SERVICE_URL}/messages`, ehrExtract, {
      adapter,
      headers
    });
    const after = new Date();

    console.log(after - before);
    expect(response.status).toEqual(201);
    //assert it returns 200
    //measure how long it took
    const beforeAttachments = new Date();
    for (const id of attachmentMessageIds) {
      const attachment = {
        data: {
          type: 'messages',
          id,
          attributes: {
            conversationId,
            messageType: 'attachment',
            attachmentMessageIds: []
          }
        }
      };
      const response = await axios.post(`${process.env.SERVICE_URL}/messages`, attachment, {
        adapter,
        headers
      });
      expect(response.status).toEqual(201);
    }

    const afterAttachments = new Date();
    console.log(afterAttachments - beforeAttachments);

    //send each attachement to ehr repo - POST /messages with type attachment for each
    //assert 200 for each
    //measure how long it took

    const retrieval = await axios.get(`${process.env.SERVICE_URL}/new/patients/${nhsNumber}`, {
      adapter,
      headers
    });
    expect(retrieval.status).toEqual(200);
    expect(retrieval.data.data.links.attachments.length).toEqual(noOfAttachments);

    //retrieve ehr
    //assert 200
    //measure how long it took
  }, 10000);
});
