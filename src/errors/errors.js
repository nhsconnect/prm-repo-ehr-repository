import { logError } from '../middleware/logging';

const ERROR_MESSAGES = {
  NO_S3_OBJECTS_FOUND_ERROR: 'Failed to find any S3 objects',
  S3_OBJECT_DELETION_ERROR: 'Failed to delete an object from S3',
  NO_HEALTH_RECORD_FOUND_ERROR: 'Failed to find the health record',
  NO_MESSAGE_FOUND_ERROR: 'Failed to find the message',
  INVALID_ARGUMENT_ERROR: 'Given argument is not valid',
};

const BACKUP_MESSAGE = 'no further details are provided.';

export class NoS3ObjectsFoundError extends Error {
  constructor(detail) {
    const message = `${ERROR_MESSAGES.NO_S3_OBJECTS_FOUND_ERROR} - ${
      detail ? detail : BACKUP_MESSAGE
    }`;
    logError(message);
    super(message);
  }
}

export class S3ObjectDeletionError extends Error {
  constructor(detail) {
    const message = `${ERROR_MESSAGES.S3_OBJECT_DELETION_ERROR} - ${
      detail ? detail : BACKUP_MESSAGE
    }`;
    logError(message);
    super(message);
  }
}

export class NoHealthRecordFoundError extends Error {
  constructor(detail) {
    const message = `${ERROR_MESSAGES.NO_HEALTH_RECORD_FOUND_ERROR} - ${
      detail ? detail : BACKUP_MESSAGE
    }`;
    logError(message);
    super(message);
  }
}

export class NoMessageFoundError extends Error {
  constructor(detail) {
    const message = `${ERROR_MESSAGES.NO_MESSAGE_FOUND_ERROR} - ${
      detail ? detail : BACKUP_MESSAGE
    }`;
    logError(message);
    super(message);
  }
}

export class InvalidArgumentError extends Error {
  constructor(detail) {
    const message = `${ERROR_MESSAGES.INVALID_ARGUMENT_ERROR} - ${
      detail ? detail : BACKUP_MESSAGE
    }`;
    logError(message);
    super(message);
  }
}
