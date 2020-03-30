import { body } from 'express-validator';

export const updateMessageValidationRules = [body('transferComplete').notEmpty()];

export const updateMessage = (req, res) => {
  res.sendStatus(204);
};
