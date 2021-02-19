import { param } from 'express-validator';
import {
  getHealthRecordStatus,
  HealthRecordStatus
} from '../../services/database/new-health-record-repository';

export const healthRecordLocationControllerValidation = [
  param('conversationId')
    .isUUID()
    .withMessage("'conversationId' provided is not a UUID"),
  param('nhsNumber')
    .isNumeric()
    .withMessage("'nhsNumber' provided is not numeric")
    .isLength({ min: 10, max: 10 })
    .withMessage("'nhsNumber' provided is not 10 characters")
];

export const healthRecordLocationController = async (req, res) => {
  const status = await getHealthRecordStatus(req.params.conversationId);

  if (status === HealthRecordStatus.COMPLETE) {
    res.sendStatus(200);
  }
};
