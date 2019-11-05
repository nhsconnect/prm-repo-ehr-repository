import express from 'express';
import upload from "./services/upload";

const app = express();

app.use(express.json());

app.post('/ehr', (req, res) => {
    if(Object.keys(req.body).length ===0){
        res.sendStatus((400));
    }
    else{
        upload(req.body.ehr, req.body.nhsNumber)
            .then(() => res.sendStatus(201));
    }
});

export default app