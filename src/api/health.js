import express from 'express';
import { validate } from '../middleware/validation';
import { updateLogEventWithError } from '../middleware/logging';
import getHealthCheck from '../services/get-health-check';

const router = express.Router();

router.get('/', validate, (req, res, next) => {
  getHealthCheck()
    .then(() => {
      res.status(200).send('healthy');
    })
    .catch(err => {
      updateLogEventWithError(err);
      next(err);
    });
});
export default router;
