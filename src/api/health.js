import express from 'express';
import { validate } from '../middleware/validation';
import { updateLogEvent, updateLogEventWithError } from '../middleware/logging';
import getHealthCheck from '../services/get-health-check';

const router = express.Router();

router.get('/', validate, (req, res, next) => {
  getHealthCheck()
    .then(status => {
      updateLogEvent({ status: 'Finished health check. Status given by res', res: res });
      res.status(200).send(status);
    })
    .catch(err => {
      updateLogEventWithError(err);
      next(err);
    });
});
export default router;
