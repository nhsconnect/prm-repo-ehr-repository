import httpContext from 'async-local-storage';
import express from 'express';
import { errorLogger, logger as requestLogger } from 'express-winston';
import swaggerUi from 'swagger-ui-express';
import { messages } from './api/messages';
import { patients } from './api/patients';
import { healthCheck } from './api/health-check/health-check';
import { options } from './config/logging';
import * as logging from './middleware/logging';
import swaggerDocument from './swagger.json';
import helmet from 'helmet';
import { rateLimiter } from './middleware/rateLimiter';
import apicache from 'apicache';

httpContext.enable();

const app = express();
let cache = apicache.middleware;

app.use(express.json());
// Sets "Strict-Transport-Security: max-age=31536000; includeSubDomains"
app.use(
  helmet.hsts({
    maxAge: 31536000,
  })
);
app.use(requestLogger(options));
app.use(rateLimiter);
app.use(cache(process.env.API_CACHE));
app.use('/patients', logging.middleware, patients);
app.use('/messages', logging.middleware, messages);
app.use('/health', logging.middleware, healthCheck);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(errorLogger(options));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

export default app;
