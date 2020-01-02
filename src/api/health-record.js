import express from 'express';
import { body } from 'express-validator';
import getSignedUrl from '../services/get-signed-url';
import { validate } from '../middleware/validation';
import { updateLogEvent, updateLogEventWithError } from '../middleware/logging';

const router = express.Router();

const createMessageValidationRules = [body('messageId').notEmpty()];
const updateMessageValidationRules = [body('transferComplete').notEmpty()];

router.post(
  '/:conversationId/message',
  createMessageValidationRules,
  validate,
  (req, res, next) => {
    getSignedUrl(req.params.conversationId, req.body.messageId)
      .then(url => {
        updateLogEvent({ status: 'Got url sucessfully', url: url });
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
