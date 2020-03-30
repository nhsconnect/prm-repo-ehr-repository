import { param } from 'express-validator';

export const patientHealthRecordsValidation = [
  param('nhsNumber')
    .optional()
    .isNumeric()
    .withMessage("'nhsNumber' provided is not numeric"),
  param('nhsNumber')
    .optional()
    .isLength({ min: 10, max: 10 })
    .withMessage("'nhsNumber' provided is not 10 characters")
];

export const patientHealthRecords = (req, res) => {
  res.sendStatus(200);
};
