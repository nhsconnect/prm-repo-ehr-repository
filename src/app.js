import express from 'express';
import getSignedUrl from './services/get-signed-url';
import httpContext from 'express-http-context';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';

const app = express();

app.use(express.json());
app.use(httpContext.middleware);

app.get('/health', (req, res) => {
  res.sendStatus(200);
});

app.post('/url', (req, res) => {
  if (Object.keys(req.body).length === 0) {
    res.sendStatus(400);
  } else {
    getSignedUrl(req.body.conversationId).then(url => {
      res.status(202).send(url);
    });
  }
});

app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

export default app;
