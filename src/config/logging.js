import { createLogger, format, transports } from 'winston';
import traverse from 'traverse';
import cloneDeep from 'lodash.clonedeep';
import { context, getSpan } from '@opentelemetry/api';
import { initializeConfig } from './index';

export const obfuscateSecrets = format((info) => {
  const OBFUSCATED_VALUE = '********';
  const SECRET_KEYS = ['passcode', 'data', 'authorization'];
  const updated = cloneDeep(info);
  traverse(updated).forEach(function () {
    if (SECRET_KEYS.includes(this.key)) this.update(OBFUSCATED_VALUE);
  });
  return updated;
});

export const addCommonFields = format((info) => {
  const config = initializeConfig();
  const nhsEnvironment = config.nhsEnvironment;
  const updated = cloneDeep(info);
  const currentSpan = getSpan(context.active());

  if (currentSpan) {
    updated['traceId'] = currentSpan.context().traceId;
  }

  updated.level = updated.level.toUpperCase();
  updated['service'] = 'ehr-repository';
  updated['environment'] = nhsEnvironment;
  return updated;
});

export const options = {
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    obfuscateSecrets(),
    addCommonFields(),
    format.json()
  ),
  transports: [new transports.Console({ handleExceptions: true })],
};

export const logger = createLogger(options);

// The code below may be useful for the traceability story
export const addCorrelationId = format((info, { correlationId }) => {
  const updated = cloneDeep(info);
  updated['correlationId'] = correlationId;
  return updated;
});
export const createIdLogger = (correlationId) => {
  const options = {
    ...options,
    format: format.combine(
      obfuscateSecrets(),
      addCorrelationId({ correlationId }),
      format.timestamp(),
      format.json()
    ),
  };
  return createLogger(options);
};
