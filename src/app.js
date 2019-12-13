import express from 'express';
import { errorLogger, logger as requestLogger } from 'express-winston';
import swaggerUi from 'swagger-ui-express';
import * as correlationInfo from './middleware/correlation';
import * as logging from './middleware/logging';
import { options } from './config/logging';
import url from './api/url';
import swaggerDocument from './swagger.json';
import getHealthCheck from "./services/get-health-check";

const app = express();

app.use(express.json());
app.use(correlationInfo.middleware);
app.use(requestLogger(options));

app.get('/health', (req, res) => {
  getHealthCheck()
    .then(()=>{
      res.status(200).send('healthy');
    })
    .catch(err=>{
      res.status(502).send(err);
    })

});

app.use('/url', logging.middleware, url);

app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(errorLogger(options));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

export default app;
