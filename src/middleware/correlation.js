import httpContext from 'async-local-storage';
import uuid from 'uuid/v4';

const CORRELATION_ID_KEY = 'correlationId';

export const getCorrelationId = () => httpContext.get(CORRELATION_ID_KEY);
export const setCorrelationInfo = () => httpContext.set(CORRELATION_ID_KEY, uuid());

export const middleware = (req, res, next) => {
  setCorrelationInfo();
  next();
};
