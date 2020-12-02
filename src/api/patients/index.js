import express from 'express';
import { authenticateRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { patientDetails, patientDetailsValidation } from './patient-details';
import { patientHealthRecords, patientHealthRecordsValidation } from './patient-health-records';
import { patientFragments, patientFragmentsValidation } from './patient-fragments';
import {
  patientHealthRecordStatus,
  patientHealthRecordStatusValidation
} from './patient-health-record-status';

const patients = express.Router();

patients.get(
  '/:nhsNumber',
  authenticateRequest,
  patientDetailsValidation,
  validate,
  patientDetails
);
patients.get(
  '/:nhsNumber/health-records',
  authenticateRequest,
  patientHealthRecordsValidation,
  validate,
  patientHealthRecords
);
patients.get(
  '/:nhsNumber/health-records/fragments',
  authenticateRequest,
  patientFragmentsValidation,
  validate,
  patientFragments
);
patients.get(
  '/:nhsNumber/health-records/:conversationId',
  authenticateRequest,
  patientHealthRecordStatusValidation,
  validate,
  patientHealthRecordStatus
);

export { patients };
