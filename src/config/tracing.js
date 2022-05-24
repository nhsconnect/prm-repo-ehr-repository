import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { context, propagation, trace } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

const tracerProvider = new NodeTracerProvider({});

propagation.setGlobalPropagator(new W3CTraceContextPropagator());

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

export function getCurrentSpanAttributes() {
  return trace.getSpan(context.active())?.attributes;
}

export function startRequest(next) {
  const span = tracer.startSpan('inboundRequestSpan', context.active());
  context.with(trace.setSpan(context.active(), span), () => {
    next();
  });
  return span;
}
