import { S3Service } from '../storage';
import { checkDbHealth } from '../database';
import { logInfo } from '../../middleware/logging';

export function getHealthCheck() {
  logInfo('Starting health check');

  const s3Service = new S3Service('health-check.txt');

  return Promise.all([s3Service.checkS3Health(), checkDbHealth()]).then(([s3, db]) => {
    logInfo('Health check status', db, s3);
    return {
      version: '1',
      description: 'Health of EHR Repo service',
      nhsEnvironment: process.env.NHS_ENVIRONMENT,
      details: {
        filestore: s3,
        database: db
      }
    };
  });
}
