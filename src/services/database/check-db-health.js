import ModelFactory from '../../models';
import { ERROR_CODES } from './pg-error-codes';
import { modelName } from '../../models/health-check';

export const checkDbHealth = () => {
  /**
   * @deprecated
   * It is decided we will not carry out health check by read/write into database anymore
   * To be deleted PRMT-4568
   */
  const HealthCheck = ModelFactory.getByName(modelName);

  return HealthCheck.create()
    .then(() => ({
      type: 'postgresql',
      connection: true,
      writable: true,
    }))
    .catch((err) => {
      if (err.parent?.code) {
        return parseHealthCheckError(err.parent.code);
      }

      return {
        type: 'postgresql',
        connection: false,
        writable: false,
        error: `Sequelize error (Message: ${err.errors[0].message})`,
      };
    });
};

const parseHealthCheckError = (code) => {
  switch (code) {
    case ERROR_CODES.INVALID_USER_PASSWORD:
    case ERROR_CODES.INVALID_CREDENTIALS:
      return {
        type: 'postgresql',
        connection: true,
        writable: false,
        error: `Authorization error (Error Code: ${code})`,
      };
    case ERROR_CODES.CONNECTION_REFUSED:
    case ERROR_CODES.INVALID_DATABASE:
      return {
        type: 'postgresql',
        connection: false,
        writable: false,
        error: `Connection error (Error Code: ${code})`,
      };
    default:
      return {
        type: 'postgresql',
        connection: false,
        writable: false,
        error: `Unknown error (Error Code: ${code})`,
      };
  }
};
