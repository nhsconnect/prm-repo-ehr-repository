import { body } from 'express-validator';
import { updateLogEventWithError, updateLogEvent } from '../../middleware/logging';
import { retrieveHealthRecord } from '../../services/database';

export const updateMessageValidationRules = [
  body('transferComplete').notEmpty(),
  body('conversationId').notEmpty()
];

export const updateMessage = (req, res) => {
  const conversationId = req.body.conversationId;
  retrieveHealthRecord(conversationId)
    .then(healthRecord => console.log(healthRecord, ' health record'))
    .then(() => {
      updateLogEvent({ status: 'Retrieved health record successfully' });
      res.sendStatus(204);
    })
    .catch(err => {
      updateLogEventWithError(err);
      res.status(503).send({ error: err.message });
    });
};
