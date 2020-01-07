import { updateLogEventWithError, updateLogEvent } from '../middleware/logging';
import { Endpoint, S3 } from 'aws-sdk';
import config from '../config';

const URL_EXPIRY_TIME = 60;
const CONTENT_TYPE = 'text/xml';

export default class S3Service {
  constructor(filename) {
    this.s3 = new S3(this._get_config());

    this.parameters = {
      Bucket: config.awsS3BucketName,
      Key: filename
    };
  }

  saveHealthInfo() {
    const inputParams = {
      type: 's3',
      bucketName: config.awsS3BucketName,
      available: true,
      writable: false
    };

    return this.save()
      .then(() => {
        inputParams.writable = true;
        return inputParams;
      })
      .catch(err => {
        inputParams.error = err;
        return inputParams;
      });
  }

  save(data) {
    return new Promise((resolve, reject) => {
      this.s3.putObject({ ...this.parameters, Body: data }, err => {
        if (err) return reject(err);
        updateLogEvent({ storage: { path: `${this.parameters.Bucket}/${this.parameters.Key}` } });
        resolve(`${this.parameters.Key}`);
      });
    });
  }

  remove() {
    return new Promise((resolve, reject) => {
      this.s3.deleteObject(this.parameters, err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  getPutSignedUrl() {
    return new Promise((resolve, reject) => {
      this.s3.getSignedUrl(
        'putObject',
        {
          ...this.parameters,
          Expires: URL_EXPIRY_TIME,
          ContentType: CONTENT_TYPE
        },
        (err, url) => {
          if (err) {
            updateLogEventWithError(err);
            return reject(err);
          }
          updateLogEvent({ storage: { url: `${url}}` } });
          resolve(url);
        }
      );
    });
  }

  _get_config() {
    if (!process.env.NODE_ENV === 'test') return {};

    return {
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      endpoint: new Endpoint(process.env.LOCALSTACK_URL),
      s3ForcePathStyle: true
    };
  }
}
