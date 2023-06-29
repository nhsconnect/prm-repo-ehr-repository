import { NoS3ObjectsFoundError, S3ObjectDeletionError } from '../../errors/errors';
import { logInfo } from '../../middleware/logging';
import { initializeConfig } from '../../config';
import { Endpoint, S3 } from 'aws-sdk';
import dayjs from 'dayjs';

const URL_EXPIRY_TIME = 60;
const CONTENT_TYPE = 'text/xml';
const config = initializeConfig();

export default class S3Service {
  constructor(filename) {
    this.s3 = new S3(this._get_config());

    this.parameters = {
      Bucket: config.awsS3BucketName,
      Key: filename,
    };
  }

  checkS3Health() {
    const result = {
      type: 's3',
      bucketName: config.awsS3BucketName,
      available: true,
      writable: false,
    };

    const date = dayjs().format('YYYY-MM-DD HH:mm:ss');
    return this._isConnected()
      .then(() =>
        this.save(date)
          .then(() => ({ ...result, writable: true }))
          .catch((err) => ({ ...result, error: err }))
      )
      .catch((err) => ({ ...result, error: err, available: false }));
  }

  save(data) {
    return new Promise((resolve, reject) => {
      this.s3.putObject({ ...this.parameters, Body: data }, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async deleteObject() {
    const foundObjects = await this.s3.listObjectsV2(this.parameters).promise();
    if (foundObjects.Contents.length === 0) throw new NoS3ObjectsFoundError();

    const deleteParams = {
      Bucket: this.parameters.Bucket,
      Delete: {
        Objects: foundObjects.Contents.map((object) => ({ Key: object.key })),
      },
    };

    this.s3.deleteObjects(deleteParams, (error, data) => {
      if (error) throw new S3ObjectDeletionError(error.message);
      else logInfo(`Successfully deleted objects from S3 bucket: ${data}`);
    });
  }

  getPresignedUrl(operation) {
    const params = {
      ...this.parameters,
      Expires: URL_EXPIRY_TIME,
    };

    if (operation === 'putObject') {
      params.ContentType = CONTENT_TYPE;
    }

    return this.s3.getSignedUrlPromise(operation, params);
  }

  _isConnected() {
    return new Promise((resolve, reject) => {
      this.s3.headBucket(
        {
          Bucket: config.awsS3BucketName,
        },
        (err) => {
          if (err) reject(err);
          resolve(true);
        }
      );
    });
  }

  _get_config() {
    if (config.nhsEnvironment === 'local') {
      return {
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        endpoint: new Endpoint(config.localstackUrl),
        s3ForcePathStyle: true,
      };
    }

    return {};
  }
}
