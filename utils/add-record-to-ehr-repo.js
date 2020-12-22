const axios = require('axios');
const adapter = require('axios/lib/adapters/http');
const { v4 } = require('uuid');
const { generateEhrExtractResponse } = require('./ehr-extract-template');

const addRecordToEhrRepo = async nhsNumber => {
  console.log('NHS Number', nhsNumber);
  const ehrRepoUrl = process.env.SERVICE_URL.replace('http://', 'https://');
  const ehrRepoKey = process.env.AUTHORIZATION_KEYS;

  //post /fragments to get the pre-signed url for s3
  const conversationId = v4().toUpperCase();
  const messageId = v4().toUpperCase();
  console.log('EHR Repo url', ehrRepoUrl);
  console.log('Conversation ID', conversationId);
  console.log('Message ID', messageId);
  const createEntryInEhrRepoData = {
    nhsNumber,
    conversationId,
    isLargeMessage: false,
    messageId,
    manifest: []
  };
  const generateS3UrlResp = await axios.post(`${ehrRepoUrl}/fragments`, createEntryInEhrRepoData, {
    headers: {
      Authorization: ehrRepoKey
    },
    adapter
  });
  const s3Url = generateS3UrlResp.data;
  console.log('Pre-signed url', s3Url);
  const gp2gpMessage = generateEhrExtractResponse(nhsNumber, conversationId, messageId);

  //put to s3 via the pre-signed url
  const s3Resp = await axios.put(s3Url, gp2gpMessage, { adapter });
  if (s3Resp.status > 299) {
    console.log('Saving to s3 failed');
    return;
  }
  //patch /fragments to mark it as complete
  const patchResp = await axios.patch(
    `${ehrRepoUrl}/fragments`,
    { conversationId, transferComplete: true },
    {
      headers: {
        Authorization: ehrRepoKey
      },
      adapter
    }
  );

  console.log('Patch response status', patchResp.status);
};

const nhsNumber = process.argv[2];
addRecordToEhrRepo(nhsNumber);
