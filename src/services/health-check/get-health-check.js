import { S3Service } from '../storage';
import { checkDbHealth } from '../database';
import { logInfo } from '../../middleware/logging';
import { initializeConfig } from '../../config';

export function getHealthCheck() {
  const config = initializeConfig();
  logInfo('Starting health check');

  const s3Service = new S3Service('health-check.txt');

  return Promise.all([s3Service.checkS3Health(), checkDbHealth()]).then(([s3, db]) => {
    logInfo('Health check status', db, s3);
    return {
      version: '1',
      description: 'Health of EHR Repo service',
      nhsEnvironment: config.nhsEnvironment,
      details: {
        filestore: s3,
        database: db
      }
    };
  });
}
