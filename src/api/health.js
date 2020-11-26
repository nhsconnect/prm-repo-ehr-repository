import express from 'express';
import { logError, logEvent } from '../middleware/logging';
import { getHealthCheck } from '../services/get-health-check';

const router = express.Router();

router.get('/', (req, res, next) => {
  getHealthCheck()
    .then(status => {
      if (
        status.details.filestore.writable &&
        status.details.database.writable &&
        status.details.filestore.available
      ) {
        logEvent('Health check successful');
        res.status(200).json(status);
      } else {
        logError('Health check failed', status);
        res.status(503).json(status);
      }
    })
    .catch(err => {
      logError('Health check error', err);
      next(err);
    });
});

export default router;
