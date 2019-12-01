import express from 'express';
import upload from "./services/upload";
import httpContext from 'express-http-context';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';

const app = express();

app.use(express.json());
app.use(httpContext.middleware);

app.get('/health', (req, res) => {
    res.sendStatus(200);
});

app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.post('/url', (req, res) => {
    if(Object.keys(req.body).length ===0){
        res.sendStatus((400));
    }
    else{
        upload(req.body.ehr, req.body.nhsNumber)
            .then(() => res.sendStatus(201));
    }
});

export default app