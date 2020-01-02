import express from 'express';
import { validate } from '../middleware/validation';
import { updateLogEventWithError } from '../middleware/logging';

const router = express.Router();

router.get('/', validate, (req, res) => {
  let err = 'TEST: EHR Repo Error logging test entry';
  updateLogEventWithError(err);
  res.status(200).send('Added test Error to the log');
});
export default router;
