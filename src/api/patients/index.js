import express from 'express';
import { authenticateRequest } from '../../middleware/auth';
import { patientDetails } from './patient-details';

const patients = express.Router();

patients.get('/', authenticateRequest, patientDetails);

export { patients };
