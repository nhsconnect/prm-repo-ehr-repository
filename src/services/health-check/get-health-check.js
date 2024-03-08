import { S3Service } from '../storage';
import { logInfo } from '../../middleware/logging';
import { initializeConfig } from '../../config';

export function getHealthCheck() {
  const config = initializeConfig();
  logInfo('Starting health check');

  const s3Service = new S3Service();

  return s3Service.checkS3Health().then((s3HealthCheckResult) => {
    logInfo('Health check status', s3HealthCheckResult);
    return {
      version: '1',
      description: 'Health of EHR Repo service',
      nhsEnvironment: config.nhsEnvironment,
      details: {
        filestore: s3HealthCheckResult,
      },
    };
  });
}
