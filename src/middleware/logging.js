import { logger } from '../config/logging';

export const logEvent = (status, event) => logger.info(status, { event });
export const logError = (status, event) => logger.error(status, { event });

export const middleware = (req, res, next) => {
  res.on('finish', () => eventFinished(req, res));
  next();
};

export const eventFinished = (req, res) => {
  const url = req.originalUrl;
  const reqLog = { req: { headers: req.headers, method: req.method } };
  const resLog = { res: { statusCode: res.statusCode, statusMessage: res.statusMessage } };

  if (res.statusCode < 400) {
    logEvent(url, { req: reqLog, res: resLog });
  } else {
    logError(url, { req: reqLog, res: resLog });
  }
};
