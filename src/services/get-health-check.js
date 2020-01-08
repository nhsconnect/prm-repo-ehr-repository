import S3Service from '../storage/s3';
import formattedDate from './get-formatted-date';
import { checkDbHealth } from '../storage/db';
import { updateLogEvent } from '../middleware/logging';

const getHealthCheck = () => {
  updateLogEvent({ status: 'Starting health check' });

  const s3Service = new S3Service(formattedDate());

  return Promise.all([s3Service.saveHealthInfo(), checkDbHealth()]).then(([s3, db]) => {
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
