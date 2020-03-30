import express from 'express';
import { authenticateRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { createNewMessageValidationRules, createMessage } from './create-message';
import { updateMessageValidationRules, updateMessage } from './update-message';

const fragments = express.Router();

fragments.post('/', authenticateRequest, createNewMessageValidationRules, validate, createMessage);

fragments.patch('/', authenticateRequest, updateMessageValidationRules, validate, updateMessage);

export { fragments };
