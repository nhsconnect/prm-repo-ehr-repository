import httpContext from 'async-local-storage';
import merge from 'lodash.merge';
import logger from '../config/logging';

const LOG_EVENT_KEY = 'logEvent';

export const updateLogEvent = event => {
  httpContext.set(LOG_EVENT_KEY, merge(httpContext.get(LOG_EVENT_KEY), event));
  logger.info('New event info', event);
};

export const updateLogEventWithError = err =>
  updateLogEvent({ error: { ...err, message: err.message, stack: err.stack } });

export const middleware = (req, res, next) => {
  httpContext.scope();
  httpContext.set(LOG_EVENT_KEY, { status: 'unknown' });
  res.on('finish', () => {
    logger.info('Event finished', { event: httpContext.get(LOG_EVENT_KEY) });
  });
  next();
};

export const logEvent = (status, event) => logger.info(status, event);
export const logError = (status, event) => logger.error(status, event);
