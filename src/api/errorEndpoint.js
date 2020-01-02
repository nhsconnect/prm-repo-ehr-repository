import express from 'express';
import { updateLogEventWithError } from '../middleware/logging';

const router = express.Router();

router.get('/', (req, res) => {
  updateLogEventWithError(new Error('TEST: EHR Repo Error logging test entry'));
  res.status(200).send('Added test Error to the log');
});

export default router;
