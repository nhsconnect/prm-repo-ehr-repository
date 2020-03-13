import express from 'express';
import { updateLogEvent, updateLogEventWithError } from '../middleware/logging';
import { getHealthCheck } from '../services/get-health-check';

const router = express.Router();

router.get('/', (req, res, next) => {
  getHealthCheck()
    .then(status => {
      updateLogEvent({ status: 'Health check completed' });
      if (
        status.details.filestore.writable &&
        status.details.database.writable &&
        status.details.filestore.available
      ) {
        res.status(200).json(status);
      } else {
        updateLogEvent(status);
        res.status(503).json(status);
      }
    })
    .catch(err => {
      updateLogEventWithError(err);
      next(err);
    });
});

export default router;
