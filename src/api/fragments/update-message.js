import { body } from 'express-validator';
import { logError, logEvent } from '../../middleware/logging';
import {
  retrieveHealthRecord,
  markHealthRecordAsCompleted,
  markHealthRecordFragmentsAsCompleted,
  markHealthRecordManifestAsCompleted
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
        markHealthRecordManifestAsCompleted(healthRecord.dataValues.id);
      }
    })
    .then(() => {
      logEvent('Retrieved health record successfully');
      res.sendStatus(204);
    })
    .catch(err => {
      logError(err.message, err);
      res.status(503).send({ error: err.message });
    });
};
