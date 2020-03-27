import express from 'express';
import { body } from 'express-validator';
import { updateLogEvent, updateLogEventWithError } from '../middleware/logging';
import { validate } from '../middleware/validation';
import { persistHealthRecord } from '../services/database';
import { getSignedUrl } from '../services/storage';
import { authenticateRequest } from '../middleware/auth';

const router = express.Router();
const createNewMessageValidationRules = [
  body('conversationId')
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

router.post('/', authenticateRequest, createNewMessageValidationRules, validate, (req, res) => {
  persistHealthRecord(
    req.body.nhsNumber,
    req.body.conversationId,
    req.body.messageId,
    req.body.manifest ? req.body.manifest : null
  )
    .then(() => getSignedUrl(req.body.conversationId, req.body.messageId))
    .then(url => {
      updateLogEvent({ status: 'Retrieved presigned url successfully' });
      res.status(201).send(url);
    })
    .catch(err => {
      updateLogEventWithError(err);
      res.status(503).send({ error: err.message });
    });
});

router.patch('/', authenticateRequest, updateMessageValidationRules, validate, (req, res) => {
  res.sendStatus(204);
});

export default router;
