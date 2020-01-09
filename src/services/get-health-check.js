import S3Service from '../storage/s3';
import { checkDbHealth } from '../storage/db';
import { updateLogEvent } from '../middleware/logging';

const getHealthCheck = () => {
  updateLogEvent({ status: 'Starting health check' });

  const s3Service = new S3Service('health-check.txt');
  return Promise.all([s3Service.checkS3Health(), checkDbHealth()]).then(([s3, db]) => {
    updateLogEvent({ db, s3 });
    return {
      version: '1',
      description: 'Health of Electronic Health Record Repository service',
      details: {
        filestore: s3,
        database: db
      }
    };
  });
};

export default getHealthCheck;
