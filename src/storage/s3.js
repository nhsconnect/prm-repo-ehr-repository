import { S3 } from 'aws-sdk';
import config from '../config';

const getUrl = key => {
  const s3 = new S3();

  const parameters = {
    Bucket: config.awsS3BucketName,
    Key: key,
    Expires: 60,
    ContentType: 'text/xml'
  };

  const url = new Promise((resolve, reject) => {
    s3.getSignedUrl('putObject', parameters, (err, url) => {
      if (err) {
        reject(err);
      }
      resolve(url);
    });
  });
  return url;
};

const save = formattedDate => {
  const data = `${formattedDate}`;
  const res = new Promise((resolve, reject) => {
    const s3 = new S3();
    const key = 'health-check.txt';
    const parameters = {
      Bucket: config.awsS3BucketName,
      Key: key,
      Body: data
    };

    s3.putObject(parameters, err => {
      if (err) {
        reject(err);
      }
      resolve(key);
    });
  });
  return res;
};

export { getUrl, save };
