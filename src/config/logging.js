import { createLogger, format, transports } from 'winston';
import traverse from 'traverse';
import cloneDeep from 'lodash.clonedeep';
import { context, trace } from '@opentelemetry/api';
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
  const currentSpan = trace.getSpan(context.active());

  if (currentSpan) {
    updated['traceId'] = currentSpan.spanContext().traceId;
    updated['conversationId'] = currentSpan.attributes.conversationId;
    updated['messageId'] = currentSpan.attributes.messageId;
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
  level: process.env.LOG_LEVEL,
  transports: [new transports.Console({ handleExceptions: true })],
};

export const logger = createLogger(options);
