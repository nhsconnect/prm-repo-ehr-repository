import { logger } from '../config/logging';
import { tracer } from '../config/tracing';
import { context, setSpan } from '@opentelemetry/api';

export const logError = (status, error) => {
  context.with(setSpan(context.active(), span), () => {
    logger.error(status, { error });
  });
};

export const logWarning = (status) => {
  context.with(setSpan(context.active(), span), () => {
    logger.warn(status);
  });
};

export const logInfo = (status) => {
  context.with(setSpan(context.active(), span), () => {
    logger.info(status);
  });
};

export const logDebug = (status) => {
  context.with(setSpan(context.active(), span), () => {
    logger.debug(status);
  });
};

let span;
export const middleware = (req, res, next) => {
  const span = tracer.startSpan('inboundRequestSpan', context.active());
  context.with(setSpan(context.active(), span), () => {});

  res.on('finish', () => eventFinished(req, res));
  context.with(setSpan(context.active(), span), () => {
    next();
  });
  span.end();
};

export const eventFinished = (req, res) => {
  const url = req.originalUrl;
  const reqLog = { headers: req.headers, method: req.method };
  const resLog = { statusCode: res.statusCode, statusMessage: res.statusMessage };

  if (res.statusCode < 400) {
    logInfo(url, { req: reqLog, res: resLog });
  } else {
    logError(url, { req: reqLog, res: resLog });
  }
};
