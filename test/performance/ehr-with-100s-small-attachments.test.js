import { v4 } from 'uuid';
import axios from 'axios';
import adapter from 'axios/lib/adapters/http';

describe('Performance of EHR with hundreds of small attachments', () => {
  it('should save everything within 10 seconds', async () => {
    // Send ehr with 100 attachments to ehr repo -
    // POST /messages with type ehrExtract and 100 entries in the attachment list
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

    const beforeEhrExtract = new Date();
    const response = await axios.post(`${process.env.SERVICE_URL}/messages`, ehrExtract, {
      adapter,
      headers
    });
    const afterEhrExtract = new Date();

    //assert it returns 201
    //measure how long it took
    console.log(
      'Time taken to store health record extract: ',
      afterEhrExtract - beforeEhrExtract,
      'ms'
    );
    expect(response.status).toEqual(201);

    //send each attachment to ehr repo - POST /messages with type attachment for each
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
      //assert 201 for each attachment
      expect(response.status).toEqual(201);
    }

    //measure how long it took
    const afterAttachments = new Date();
    console.log(
      'Time taken to store all attachments: ',
      afterAttachments - beforeAttachments,
      'ms'
    );

    //retrieve ehr
    const retrieval = await axios.get(`${process.env.SERVICE_URL}/new/patients/${nhsNumber}`, {
      headers,
      adapter
    });
    //assert 200
    expect(retrieval.status).toEqual(200);
    expect(retrieval.data.data.links.attachments.length).toEqual(noOfAttachments);

    //measure how long it took
    console.log('Time taken to store entire EHR: ', afterAttachments - beforeEhrExtract, 'ms');
  }, 10000);
});
