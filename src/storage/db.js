import { updateLogEvent } from '../middleware/logging';
import ModelFactory from '../database/models';
import uuid from 'uuid/v4';
import { ERROR_CODES } from './pg-error-codes';

export const saveHealthCheck = () => {
  const HealthCheck = ModelFactory.getByName('HealthCheck');

  return HealthCheck.create({ slug: uuid() })
    .then(() => updateLogEvent({ db: { connection: true, writable: true } }))
    .then(() => ({
      type: 'postgresql',
      connection: true,
      writable: true
    }))
    .catch(err => {
      if (err.parent && err.parent.code) {
        return parseHealthCheckError(err.parent.code);
      }

      return {
        type: 'postgresql',
        connection: false,
        writable: false,
        error: `Sequelize error (Message: ${err.errors[0].message})`
      };
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
