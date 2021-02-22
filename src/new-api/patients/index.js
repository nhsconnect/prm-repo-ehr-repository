import express from 'express';
import {
  healthRecordController,
  healthRecordControllerValidation
} from './health-record-controller';
import { validate } from '../../middleware/validation';
import { authenticateRequest } from '../../middleware/auth';
import { patientDetailsController, patientDetailsValidation } from './patient-details-controller';

export const patients = express.Router();

patients.get(
  '/:nhsNumber/health-records/:conversationId',
  authenticateRequest,
  healthRecordControllerValidation,
  validate,
  healthRecordController
);

patients.get(
  '/:nhsNumber',
  authenticateRequest,
  patientDetailsValidation,
  validate,
  patientDetailsController
);
