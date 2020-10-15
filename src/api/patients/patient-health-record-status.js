import { param } from 'express-validator';
import { retrieveHealthRecord } from '../../services/database';

export const patientHealthRecordStatusValidation = [
  param('nhsNumber')
    .isNumeric()
    .withMessage("'nhsNumber' provided is not numeric"),
  param('nhsNumber')
    .isLength({ min: 10, max: 10 })
    .withMessage("'nhsNumber' provided is not 10 characters"),
  param('conversationId')
    .isUUID('4')
    .withMessage("'conversationId' provided is not of type UUIDv4")
];

export const patientHealthRecordStatus = (req, res) => {
  retrieveHealthRecord(req.params.conversationId).then(healthRecord => {
    if (!healthRecord) {
      res.sendStatus(404);
      return;
    }
    let body = {
      data: {
        type: 'health-record',
        id: req.params.conversationId,
        attributes: {
          status: healthRecord.dataValues.completed_at ? 'success' : 'pending',
          completed_at: healthRecord.dataValues.completed_at
        }
      }
    };
    res.status(200).send(body);
  });
};
