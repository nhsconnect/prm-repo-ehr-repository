import express from 'express';
import { body, param } from 'express-validator';
import { updateLogEvent, updateLogEventWithError } from '../middleware/logging';
import { validate } from '../middleware/validation';
import { persistHealthRecord } from '../services/database';
import { getSignedUrl } from '../services/storage';

const router = express.Router();

const createMessageValidationRules = [body('messageId').notEmpty()];

const createNewMessageValidationRules = [
  param('conversationId')
    .isUUID('4')
    .withMessage("'conversationId' provided is not of type UUIDv4"),
  body('nhsNumber')
    .optional()
    .isNumeric()
    .withMessage("'nhsNumber' provided is not numeric"),
  body('nhsNumber')
    .optional()
    .isLength({ min: 10, max: 10 })
    .withMessage("'nhsNumber' provided is not 10 characters"),
  body('messageId')
    .isUUID('4')
    .withMessage("'messageId' provided is not of type UUIDv4"),
  body('messageId')
    .notEmpty()
    .withMessage("'messageId' is a required field"),
  body('manifest')
    .optional()
    .isArray()
    .withMessage("'manifest' provided is not of type Array")
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
        console.log(err);
        updateLogEventWithError(err);
        next(err);
      });
  }
);

router.patch(
  '/:conversationId/message/:messageId',
  updateMessageValidationRules,
  validate,
  (req, res) => {
    res.sendStatus(204);
  }
);

export default router;
