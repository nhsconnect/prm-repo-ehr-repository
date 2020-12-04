import ModelFactory from '../../models';
import { runWithinTransaction } from './helper';

const HealthRecord = ModelFactory.getByName('HealthRecord');
const MessageFragment = ModelFactory.getByName('MessageFragment');
const HealthRecordManifest = ModelFactory.getByName('HealthRecordManifest');
const Patient = ModelFactory.getByName('Patient');

export const getCurrentHealthRecordForPatient = nhsNumber =>
  getPatientByNhsNumber(nhsNumber).then(patient => {
    if (patient === null) return null;
    return getHealthRecordByPatientId(patient.dataValues.id);
  });

export const getPatientByNhsNumber = nhsNumber =>
  runWithinTransaction(transaction => Patient.findByNhsNumber(nhsNumber, transaction));

export const getHealthRecordByPatientId = patientId =>
  runWithinTransaction(transaction => HealthRecord.findByPatientId(patientId, transaction));

export const retrieveHealthRecord = conversationId =>
  runWithinTransaction(transaction =>
    HealthRecord.findByConversationId(conversationId, transaction)
  );

export const markHealthRecordAsCompleted = conversationId =>
  runWithinTransaction(transaction =>
    HealthRecord.complete({ where: { conversation_id: conversationId }, transaction })
  );

export const markHealthRecordFragmentsAsCompleted = healthRecordId =>
  runWithinTransaction(transaction =>
    MessageFragment.complete({ where: { health_record_id: healthRecordId }, transaction })
  );

export const markHealthRecordManifestAsCompleted = healthRecordId =>
  runWithinTransaction(transaction =>
    HealthRecordManifest.complete({ where: { health_record_id: healthRecordId }, transaction })
  );
