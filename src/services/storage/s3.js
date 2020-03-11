import dayjs from 'dayjs';
import { Endpoint, S3 } from 'aws-sdk';
import config from '../../config';

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

    const date = dayjs().format('YYYY-MM-DD HH:mm:ss');
    return this._isConnected()
      .then(() =>
        this.save(date)
          .then(() => ({ ...result, writable: true }))
          .catch(err => ({ ...result, error: err }))
      )
      .catch(err => ({ ...result, error: err, available: false }));
  }

  save(data) {
    return new Promise((resolve, reject) => {
      this.s3.putObject({ ...this.parameters, Body: data }, err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  getPresignedUrl() {
    return this.s3.getSignedUrlPromise('putObject', {
      ...this.parameters,
      Expires: URL_EXPIRY_TIME,
      ContentType: CONTENT_TYPE
    });
  }

  _isConnected() {
    return new Promise((resolve, reject) => {
      this.s3.headBucket(
        {
          Bucket: config.awsS3BucketName
        },
        err => {
          if (err) reject(err);
          resolve(true);
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
