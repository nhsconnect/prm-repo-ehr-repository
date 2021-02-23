import { param } from 'express-validator';
import {
  getCurrentHealthRecordIdForPatient,
  getHealthRecordMessageIds
} from '../../services/database/new-health-record-repository';
import { logError } from '../../middleware/logging';

export const patientDetailsValidation = [
  param('nhsNumber')
    .isNumeric()
    .withMessage("'nhsNumber' provided is not numeric")
    .isLength({ min: 10, max: 10 })
    .withMessage("'nhsNumber' provided is not 10 characters")
];

export const patientDetailsController = async (req, res) => {
  const { nhsNumber } = req.params;
  const endpointUrl = `${process.env.SERVICE_URL}/messages`;

  try {
    const currentHealthRecordId = await getCurrentHealthRecordIdForPatient(nhsNumber);
    const { healthRecordExtractId, attachmentIds } = await getHealthRecordMessageIds(
      currentHealthRecordId
    );
    const healthRecordExtractUrl = `${endpointUrl}/${currentHealthRecordId}/${healthRecordExtractId}`;

    let attachmentUrls = [];
    for (const attachmentId in attachmentIds) {
      const url = `${endpointUrl}/${currentHealthRecordId}/${attachmentIds[attachmentId]}`;
      attachmentUrls.push(url);
    }

    const responseBody = {
      data: {
        type: 'patients',
        id: nhsNumber,
        links: {
          healthRecordExtract: healthRecordExtractUrl,
          attachments: attachmentUrls
        }
      }
    };

    res.status(200).json(responseBody);
  } catch (err) {
    logError('Could not retrieve patient health record', err);
    res.sendStatus(503);
  }
};
