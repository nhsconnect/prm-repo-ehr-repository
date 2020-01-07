import S3Service from '../storage/s3';
import formattedDate from './get-formatted-date';
import { saveHealthCheck } from '../storage/db';
import { updateLogEvent } from '../middleware/logging';

const getHealthCheck = () => {
  updateLogEvent({
    status: 'Starting health check'
  });

  let apiResponse = {
    version: '1',
    description: 'Health of Electronic Health Record Repository service',
    details: {
      'file-store': {},
      database: {}
    }
  };

  const s3Service = new S3Service(formattedDate());

  return Promise.all([s3Service.saveHealthInfo(), saveHealthCheck()]).then(values => {
    let [s3, db] = values;

    apiResponse.details['file-store'] = s3;
    apiResponse.details['database'] = db;
    apiResponse.status = s3.writeable && db.writeable ? 'Pass' : 'Fail';

    return Promise.resolve(apiResponse);
  });
};

export default getHealthCheck;
