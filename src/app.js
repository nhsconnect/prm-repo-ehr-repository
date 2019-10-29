import express from 'express';
import upload from "./services/upload";

const app = express();

app.use(express.json());

app.post('/ehr', (req, res) => {
    upload(req.body.data)
        .then(() => res.sendStatus(201));
});

export default app