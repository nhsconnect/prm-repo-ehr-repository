import { body } from 'express-validator';
import { updateLogEventWithError, updateLogEvent } from '../../middleware/logging';
import {
  retrieveHealthRecord,
  markHealthRecordAsCompleted,
  markHealthRecordFragmentsAsCompleted
} from '../../services/database';

export const updateMessageValidationRules = [
  body('transferComplete').notEmpty(),
  body('conversationId').notEmpty()
];

export const updateMessage = (req, res) => {
  const conversationId = req.body.conversationId;

  retrieveHealthRecord(conversationId)
    .then(healthRecord => {
      if (healthRecord.dataValues.is_large_message === false) {
        markHealthRecordAsCompleted(conversationId);
        markHealthRecordFragmentsAsCompleted(healthRecord.dataValues.id);
      }
    })
    .then(() => {
      updateLogEvent({ status: 'Retrieved health record successfully' });
      res.sendStatus(204);
    })
    .catch(err => {
      updateLogEventWithError(err);
      res.status(503).send({ error: err.message });
    });
};
