import express from 'express';
import { body } from 'express-validator';
import getSignedUrl from '../services/get-signed-url';
import { validate } from '../middleware/validation';
import { updateLogEventWithError } from '../middleware/logging';

const router = express.Router();

const urlRequestValidationRules = [body('conversationId').notEmpty()];

router.post('/', urlRequestValidationRules, validate, (req, res, next) => {
  getSignedUrl(req.body.conversationId)
    .then(url => res.status(202).send(url))
    .catch(err => {
      updateLogEventWithError(err);
      next(err);
    });
});

export default router;
