import { param } from 'express-validator';

export const patientDetailsValidation = [
  param('nhsNumber')
    .isNumeric()
    .withMessage("'nhsNumber' provided is not numeric")
    .isLength({ min: 10, max: 10 })
    .withMessage("'nhsNumber' provided is not 10 characters")
];

export const patientDetailsController = (req, res) => {
  res.sendStatus(200);
};
