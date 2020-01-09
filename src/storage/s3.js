import moment from 'moment';
import { Endpoint, S3 } from 'aws-sdk';
import { updateLogEvent, updateLogEventWithError } from '../middleware/logging';
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

  checkS3Health() {
    const result = {
      type: 's3',
      bucketName: config.awsS3BucketName,
      available: true,
      writable: false
    };

    const date = moment().format('YYYY-MM-DD HH:mm:ss');
    return this.save(date)
      .then(() => ({ ...result, writable: true }))
      .catch(err => ({ ...result, error: err }));
  }

  save(data) {
    return new Promise((resolve, reject) => {
      this.s3.putObject({ ...this.parameters, Body: data }, err => {
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
    if (!config.isLocal) return {};

    return {
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      endpoint: new Endpoint(config.localstackUrl),
      s3ForcePathStyle: true
    };
  }
}
