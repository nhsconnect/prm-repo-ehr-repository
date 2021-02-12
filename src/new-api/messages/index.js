import express from 'express';
import { authenticateRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import {
  messageLocationController,
  messageLocationControllerValidation
} from './message-location-controller';

export const messages = express.Router();

messages.get(
  '/:conversationId/:messageId',
  authenticateRequest,
  messageLocationControllerValidation,
  validate,
  messageLocationController
);
