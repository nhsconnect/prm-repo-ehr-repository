import { logError } from '../middleware/logging';

const ERROR_MESSAGES = {
  NO_S3_OBJECTS_FOUND_ERROR: 'Failed to find any S3 objects',
  S3_OBJECT_DELETION_ERROR: 'Failed to delete an object from S3',
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
