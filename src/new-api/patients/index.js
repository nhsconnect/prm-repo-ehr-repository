import express from 'express';
import {
  healthRecordLocationController,
  healthRecordLocationControllerValidation
} from './health-record-location-controller';
import { validate } from '../../middleware/validation';
import { authenticateRequest } from '../../middleware/auth';

export const patients = express.Router();

patients.get(
  '/:nhsNumber/health-records/:conversationId',
  authenticateRequest,
  healthRecordLocationControllerValidation,
  validate,
  healthRecordLocationController
);
