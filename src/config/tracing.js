import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { context, getSpan, propagation } from '@opentelemetry/api';
import { HttpTraceContext } from '@opentelemetry/core';
import { NodeTracerProvider } from '@opentelemetry/node';

const tracerProvider = new NodeTracerProvider({});

propagation.setGlobalPropagator(new HttpTraceContext());

tracerProvider.register();
registerInstrumentations({
  tracerProvider: tracerProvider,
  instrumentations: [new HttpInstrumentation()],
});

console.log('Tracing initialised');

export const tracer = tracerProvider.getTracer('ehr-repo-tracer');

export const setCurrentSpanAttributes = (attributes) => {
  const currentSpan = getSpan(context.active());
  if (currentSpan) {
    currentSpan.setAttributes(attributes);
  }
};
