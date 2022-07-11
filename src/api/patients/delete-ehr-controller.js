import { param } from 'express-validator';
import { logError, logInfo } from '../../middleware/logging';

export const deleteEhrValidation = [
  param('nhsNumber')
    .isNumeric()
    .withMessage("'nhsNumber' provided is not numeric")
    .isLength({ min: 10, max: 10 })
    .withMessage("'nhsNumber' provided is not 10 characters"),
];

export const deleteEhrController = async (req, res) => {
  const { nhsNumber } = req.params;
  logInfo('delete endpoint has been called!');

  try {
    const responseBody = {
      data: {
        type: 'patients',
        id: nhsNumber,
      },
    };

    res.status(200).json(responseBody);
  } catch (err) {
    logError('Could not retrieve patient health record', err);
    res.sendStatus(503);
  }
};
