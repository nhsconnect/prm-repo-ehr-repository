import { param } from 'express-validator';

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
  res.sendStatus(200);
};
