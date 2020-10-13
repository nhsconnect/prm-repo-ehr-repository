import { validationResult } from 'express-validator';
import { updateLogEvent } from './logging';

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    updateLogEvent({ status: 'validation-passed', validation: { status: 'passed' } });
    return next();
  }

  const mappedErrors = errors.array().map(err => ({ [err.param]: err.msg }));
  updateLogEvent({
    status: 'validation-failed',
    validation: { status: 'failed', errors: mappedErrors }
  });
  return res.status(422).json({
    errors: mappedErrors
  });
};
