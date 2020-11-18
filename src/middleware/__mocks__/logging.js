export const updateLogEvent = jest.fn();
export const logEvent = jest.fn();
export const logError = jest.fn();

export const updateLogEventWithError = jest.fn();

export const middleware = (req, res, next) => next();

export const withContext = fn => fn();

export const eventFinished = jest.fn();
