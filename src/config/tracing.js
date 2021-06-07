import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { context, trace, propagation } from '@opentelemetry/api';
import { HttpTraceContextPropagator } from '@opentelemetry/core';
import { NodeTracerProvider } from '@opentelemetry/node';

const tracerProvider = new NodeTracerProvider({});

propagation.setGlobalPropagator(new HttpTraceContextPropagator());

tracerProvider.register();
registerInstrumentations({
  tracerProvider: tracerProvider,
  instrumentations: [new HttpInstrumentation()],
});

console.log('Tracing initialised');

export const tracer = tracerProvider.getTracer('ehr-repo-tracer');

export const setCurrentSpanAttributes = (attributes) => {
  const currentSpan = trace.getSpan(context.active());
  if (currentSpan) {
    currentSpan.setAttributes(attributes);
  }
};
