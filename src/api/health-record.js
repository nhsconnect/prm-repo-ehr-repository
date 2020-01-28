import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { updateLogEvent, updateLogEventWithError } from '../middleware/logging';
import { getSignedUrl } from '../services/storage';
import { persistHealthRecord } from '../services/database';

const router = express.Router();

const createMessageValidationRules = [body('messageId').notEmpty()];
const createNewMessageValidationRules = [
  body('nhsNumber').notEmpty(),
  body('messageId').notEmpty()
];
const updateMessageValidationRules = [body('transferComplete').notEmpty()];

// TODO: Remove after changes made to GP2GP Adapter
router.post(
  '/:conversationId/message',
  createMessageValidationRules,
  validate,
  (req, res, next) => {
    getSignedUrl(req.params.conversationId, req.body.messageId)
      .then(url => {
        updateLogEvent({ status: 'Retrieved presigned url successfully' });
        res.status(201).send(url);
      })
      .catch(err => {
        updateLogEventWithError(err);
        next(err);
      });
  }
);

router.post(
  '/:conversationId/new/message',
  createNewMessageValidationRules,
  validate,
  (req, res, next) => {
    persistHealthRecord(
      req.body.nhsNumber,
      req.params.conversationId,
      req.body.messageId,
      req.body.manifest ? req.body.manifest : null
    )
      .then(() => getSignedUrl(req.params.conversationId, req.body.messageId))
      .then(url => {
        updateLogEvent({ status: 'Retrieved presigned url successfully' });
        res.status(201).send(url);
      })
      .catch(err => {
        updateLogEventWithError(err);
        next(err);
      });
  }
);

router.put(
  '/:conversationId/message/:messageId',
  updateMessageValidationRules,
  validate,
  (req, res) => {
    res.sendStatus(204);
  }
);

export default router;
