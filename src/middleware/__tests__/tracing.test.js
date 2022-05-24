import { getCurrentSpanAttributes, startRequest } from '../../config/tracing';
import { middleware } from '../tracing';

describe('tracing middleware', () => {
  it('should generate traceId if none is provided', () => {
    let req = {
      headers: {}
    };
    startRequest(() => {
      middleware(req, {}, () => {});
      const attributes = getCurrentSpanAttributes();
      expect(attributes.traceId).toMatch(/^[0-9a-fA-F-]{36}$/);
    });
  });
});