import {
  InvalidArgumentError,
  NoS3ObjectsFoundError,
  S3ObjectDeletionError,
} from '../../errors/errors';
import { logInfo } from '../../middleware/logging';
import { initializeConfig } from '../../config';
import { Endpoint, S3 } from 'aws-sdk';
import dayjs from 'dayjs';

const URL_EXPIRY_TIME = 60;
const CONTENT_TYPE = 'text/xml';
const config = initializeConfig();

export default class S3Service {
  // TODO: This interface is using aws-sdk v2,
  // which is announced to be entering maintenance mode in 2023, and could possibly EOL in 2024.
  // To consider upgrade to v3 when we have time.
  constructor(filename) {
    this.s3 = new S3(this._get_config());
    this.Bucket = config.awsS3BucketName;

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

  saveObjectWithName(filename, data) {
    const params = {
      Bucket: config.awsS3BucketName,
      Key: filename,
      Body: data,
    };
    return this.s3.putObject(params).promise();
  }

  async listObjects() {
    const listObjectParams = {
      Bucket: this.Bucket,
    };
    return this.s3
      .listObjectsV2(listObjectParams)
      .promise()
      .then((foundObjects) => foundObjects.Contents);
  }

  buildDeleteParamsFromObjects(arrayOfObjects) {
    return {
      Bucket: this.Bucket,
      Delete: {
        Objects: arrayOfObjects.map((object) => ({ Key: object.Key })),
      },
    };
  }

  async deleteObjectsByPrefix(prefix) {
    if (typeof prefix !== 'string' || prefix.length === 0) {
      // reject here to prevent accidentally wiping out whole bucket by calling with empty prefix
      throw new InvalidArgumentError('Prefix has to be a non-empty string');
    }
    const listObjectParams = {
      Bucket: this.Bucket,
      Prefix: prefix,
    };

    const foundObjects = await this.s3.listObjectsV2(listObjectParams).promise();
    if (foundObjects.Contents.length === 0) throw new NoS3ObjectsFoundError();

    const deleteParams = this.buildDeleteParamsFromObjects(foundObjects.Contents);

    try {
      const data = await this.s3.deleteObjects(deleteParams).promise();
      logInfo('Successfully deleted objects from S3 bucket:');
      logInfo(data?.Deleted); // this log a list of deleted objects
    } catch (error) {
      throw new S3ObjectDeletionError(error.message);
    }
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
