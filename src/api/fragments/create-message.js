import { body } from 'express-validator';
import { updateLogEvent, updateLogEventWithError } from '../../middleware/logging';
import { persistHealthRecord } from '../../services/database';
import { getSignedUrl } from '../../services/storage';

export const createNewMessageValidationRules = [
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
    .withMessage("'manifest' provided is not of type Array"),
  body('isLargeMessage')
    .optional()
    .isBoolean()
    .withMessage("'isLargeMessage' provided is not a boolean")
];

export const createMessage = (req, res) => {
  const largeMessageFieldExists = req.body.isLargeMessage !== undefined;
  persistHealthRecord(
    req.body.nhsNumber,
    req.body.conversationId,
    req.body.messageId,
    req.body.manifest ? req.body.manifest : null,
    largeMessageFieldExists ? req.body.isLargeMessage : true
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
};
