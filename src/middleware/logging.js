import { logger } from '../config/logging';

export const logError = (status, error) => logger.error(status, { error });
export const logWarning = status => logger.warn(status);
export const logInfo = status => logger.info(status);
export const logDebug = status => logger.debug(status);

export const middleware = (req, res, next) => {
  res.on('finish', () => eventFinished(req, res));
  next();
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
