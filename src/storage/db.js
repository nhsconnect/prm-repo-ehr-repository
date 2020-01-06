import { updateLogEventWithError, updateLogEvent } from '../middleware/logging';
import models from "../database/models";
import uuid from "uuid/v4";


const save = (nhsNumber, storageLocation) => {

  const HealthRecord = models.HealthRecord;

  updateLogEvent({ status: 'start saving ehr into database...' });

  return HealthRecord.create({
      conversation_id: uuid(),
      patient_id: nhsNumber,
      slug: storageLocation
    })
    .then(result => {
      updateLogEvent({
        status: `Created new record: ${result}`
      });
    })
    .catch(err => {
      updateLogEventWithError(err);
      throw err;
    });
};

const saveHealthCheck = () => {

  const HealthCheck = models.HealthCheck;
  const slug = uuid();

  updateLogEvent({ status: 'start database health check...' });

  return HealthCheck.create({
      slug: slug
    })
    .then(result => {
      updateLogEvent({
        status: `Created HealthCheck record: ${result}`
      });
      return slug;
    })
    .catch(err => {
      updateLogEventWithError(err);
      throw err;
    });
};

export { save, saveHealthCheck };
