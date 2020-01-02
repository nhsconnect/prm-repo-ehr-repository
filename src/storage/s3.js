import { S3 } from 'aws-sdk';
import config from '../config';
import { updateLogEventWithError, updateLogEvent } from '../middleware/logging';

const getUrl = key => {
  const s3 = new S3();

  const parameters = {
    Bucket: config.awsS3BucketName,
    Key: key,
    Expires: 60,
    ContentType: 'text/xml'
  };

  return new Promise((resolve, reject) => {
    s3.getSignedUrl('putObject', parameters, (err, url) => {
      if (err) {
        updateLogEventWithError(err);
        return reject(err);
      }
      updateLogEvent({ storage: { url: `${url}}` } });
      resolve(url);
    });
  });
};

const save = formattedDate => {
  const data = `${formattedDate}`;
  return new Promise(resolve => {
    const s3 = new S3();
    const key = 'health-check.txt';

    let resultObject = {
      type: 's3',
      bucketName: config.awsS3BucketName,
      available: true,
      writable: false
    };

    const parameters = {
      Bucket: config.awsS3BucketName,
      Key: key,
      Body: data
    };

    s3.putObject(parameters, err => {
      if (err) {
        updateLogEventWithError(err);
        resultObject.error = err;
        return resolve(resultObject);
      }
      updateLogEvent({ storage: { path: `${config.awsS3BucketName}/${key}` } });
      resultObject.writable = true;
      resolve(resultObject);
    });
  });
};

export { getUrl, save };
