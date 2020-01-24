import { S3Service } from './storage';
import { checkDbHealth } from './database';
import { updateLogEvent } from '../middleware/logging';

export function getHealthCheck() {
  updateLogEvent({ status: 'Starting health check' });

  const s3Service = new S3Service('health-check.txt');

  return Promise.all([s3Service.checkS3Health(), checkDbHealth()]).then(([s3, db]) => {
    updateLogEvent({ db, s3 });
    return {
      version: '1',
      description: 'Health of Electronic Health Record Repository service',
      node_env: process.env.NODE_ENV,
      details: {
        filestore: s3,
        database: db
      }
    };
  });
}
