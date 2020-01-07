import { updateLogEventWithError, updateLogEvent } from '../middleware/logging';
import ModelFactory from '../database/models';
import uuid from 'uuid/v4';
import { ERROR_CODES } from './pg-error-codes';

const save = (nhsNumber, conversationId) => {
  const HealthRecord = ModelFactory.getByName('HealthRecord');

  updateLogEvent({ status: 'start saving ehr into database...' });

  return HealthRecord.create({
    slug: uuid(),
    conversation_id: conversationId,
    patient_id: nhsNumber
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
  const HealthCheck = ModelFactory.getByName('HealthCheck');

  const slug = uuid();

  updateLogEvent({ status: 'start database health check...' });

  return HealthCheck.create({
    slug: slug
  })
    .then(result => {
      updateLogEvent({
        status: `Created HealthCheck record: ${result}`
      });

      return {
        type: 'postgresql',
        connection: true,
        writable: true
      };
    })
    .catch(err => {
      updateLogEventWithError(err);

      if (err.parent === undefined || err.parent.code === undefined) {
        return {
          type: 'postgresql',
          connection: false,
          writable: false,
          error: `Sequelize error (Message: ${err.errors[0].message})`
        };
      }

      return parseHealthCheckError(err.parent.code);
    });
};

const parseHealthCheckError = code => {
  if (code === ERROR_CODES.INVALID_USER_PASSWORD) {
    return {
      type: 'postgresql',
      connection: false,
      writable: true,
      error: `Authorization error (Error Code: ${code})`
    };
  } else if (code === ERROR_CODES.CONNECTION_REFUSED || code === ERROR_CODES.INVALID_DATABASE) {
    return {
      type: 'postgresql',
      connection: false,
      writable: false,
      error: `Connection error (Error Code: ${code})`
    };
  } else {
    return {
      type: 'postgresql',
      connection: false,
      writable: false,
      error: `Unknown error (Error Code: ${code})`
    };
  }
};

export { save, saveHealthCheck };
