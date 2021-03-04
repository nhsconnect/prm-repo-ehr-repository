import { initializeConfig } from '../src/config';
import { logError, logInfo } from '../src/middleware/logging';

const { Endpoint, S3 } = require('aws-sdk');

const config = initializeConfig();
const MAX_ATTEMPTS = 30;

const isConnected = () => {
  return new Promise(resolve => {
    const s3 = new S3({
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      endpoint: new Endpoint(config.localstackUrl),
      s3ForcePathStyle: true
    });

    s3.headBucket(
      {
        Bucket: config.awsS3BucketName
      },
      err => {
        if (err) resolve(false);
        resolve(true);
      }
    );
  });
};

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

const checkIfConnected = async () => {
  for (let count = 0; count <= MAX_ATTEMPTS; ++count) {
    logInfo(`Attempting to connect to bucket in localstack (Attempt ${count} of ${MAX_ATTEMPTS})`);

    const result = await isConnected();

    if (result) {
      logInfo('Successfully connected to localstack');
      return;
    }
    await sleep(1000);
  }

  logError(`Connection to Localstack timedout after ${MAX_ATTEMPTS}`);
  throw new Error(`Connection to Localstack timedout after ${MAX_ATTEMPTS}`);
};

checkIfConnected();
