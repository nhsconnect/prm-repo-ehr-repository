import { setCurrentSpanAttributes } from '../config/tracing';
import { v4 as uuid } from 'uuid';

export const middleware = (req, res, next) => {
  const traceId =  uuid();
  setCurrentSpanAttributes({ traceId });
  next();
};