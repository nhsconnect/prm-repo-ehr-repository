import { createLogger, format, transports } from 'winston';
import traverse from 'traverse';
import cloneDeep from 'lodash.clonedeep';

const OBFUSCATED_VALUE = '********';
const SECRET_KEYS = ['passcode', 'data', 'authorization'];

export const obfuscateSecrets = format(info => {
  const updated = cloneDeep(info);
  traverse(updated).forEach(function() {
    if (SECRET_KEYS.includes(this.key)) this.update(OBFUSCATED_VALUE);
  });
  return updated;
});

export const options = {
  format: format.combine(obfuscateSecrets(), format.timestamp(), format.json()),
  transports: [new transports.Console({ handleExceptions: true })]
};

export const logger = createLogger(options);
