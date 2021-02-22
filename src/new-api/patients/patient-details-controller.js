import { param } from 'express-validator';
import {
  getCurrentHealthRecordIdForPatient,
  getHealthRecordExtractMessageId
} from '../../services/database/new-health-record-repository';

export const patientDetailsValidation = [
  param('nhsNumber')
    .isNumeric()
    .withMessage("'nhsNumber' provided is not numeric")
    .isLength({ min: 10, max: 10 })
    .withMessage("'nhsNumber' provided is not 10 characters")
];

export const patientDetailsController = async (req, res) => {
  const { nhsNumber } = req.params;
  const serviceUrl = process.env.SERVICE_URL;
  const currentHealthRecordId = await getCurrentHealthRecordIdForPatient(nhsNumber);
  const healthRecordExtractId = await getHealthRecordExtractMessageId(currentHealthRecordId);

  const healthRecordExtractUrl = `${serviceUrl}/messages/${currentHealthRecordId}/${healthRecordExtractId}`;

  const responseBody = {
    data: {
      type: 'patients',
      id: nhsNumber,
      links: {
        healthRecordExtract: healthRecordExtractUrl
      }
    }
  };

  res.status(200).json(responseBody);
};
