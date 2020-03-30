import express from 'express';
import { authenticateRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { patientDetails } from './patient-details';
import { patientHealthRecords, patientHealthRecordsValidation } from './patient-health-records';

const patients = express.Router();

patients.get('/', authenticateRequest, patientDetails);
patients.get(
  '/:nhsNumber/health-records',
  authenticateRequest,
  patientHealthRecordsValidation,
  validate,
  patientHealthRecords
);

export { patients };
