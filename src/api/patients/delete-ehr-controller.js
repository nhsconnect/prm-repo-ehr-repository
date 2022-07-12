import { param } from 'express-validator';
import { logError, logInfo } from '../../middleware/logging';
import { deleteHealthRecordForPatient } from '../../services/database/health-record-repository';
export const deleteEhrValidation = [
  param('nhsNumber')
    .isNumeric()
    .withMessage("'nhsNumber' provided is not numeric")
    .isLength({ min: 10, max: 10 })
    .withMessage("'nhsNumber' provided is not 10 characters"),
];

export const deleteEhrController = async (req, res) => {
  const { nhsNumber } = req.params;

  try {
    const conversationId = await deleteHealthRecordForPatient(nhsNumber);
    if (!conversationId) {
      logError('Could not find EHR record');
      res.sendStatus(404);
      return;
    }

    logInfo('EHR record deleted successfully');

    const responseBody = {
      data: {
        type: 'patients',
        id: nhsNumber,
        conversationId,
      },
    };

    res.status(200).json(responseBody);
  } catch (err) {
    logError('Could not delete EHR record', err);
    res.sendStatus(503);
  }
};
