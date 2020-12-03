import { param } from 'express-validator';
import { getCurrentHealthRecordForPatient } from '../../services/database';
import { logError } from '../../middleware/logging';

export const patientDetailsValidation = [
  param('nhsNumber')
    .optional()
    .isNumeric()
    .withMessage("'nhsNumber' provided is not numeric"),
  param('nhsNumber')
    .optional()
    .isLength({ min: 10, max: 10 })
    .withMessage("'nhsNumber' provided is not 10 characters")
];

export const patientDetails = async (req, res) => {
  try {
    const healthRecord = await getCurrentHealthRecordForPatient(req.params.nhsNumber);
    if (healthRecord === null) {
      res.sendStatus(404);
      return;
    }
    const responseBody = {
      data: {
        id: req.params.nhsNumber,
        type: 'patient',
        attributes: {
          conversationId: healthRecord.dataValues.conversation_id
        }
      }
    };
    res.status(200).json(responseBody);
  } catch (err) {
    logError('Error retrieving patient health record', err);
    res.status(500).send({ error: err.message });
  }
};
