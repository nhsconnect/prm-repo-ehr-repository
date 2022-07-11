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

  //TODO:
  // - set deleted-at in health_record table
  // - set deleted-at in messages table
  // - all in a transaction https://sequelize.org/docs/v6/other-topics/transactions/

  try {
    const responseBody = {
      data: {
        type: 'patients',
        id: nhsNumber,
      },
    };

    await deleteHealthRecordForPatient(nhsNumber);

    logInfo('EHR record deleted successfully');
    res.status(200).json(responseBody);
  } catch (err) {
    logError('Could not delete EHR record', err);
    res.sendStatus(503);
  }
};
