import ModelFactory from '../../models';
import { runWithinTransaction } from './helper';
import { modelName } from '../../models/health-record';
import { modelName as healthRecordManifest } from '../../models/health-record-manifest';
import { modelName as messageFragment } from '../../models/message-fragment';
import { modelName as patient } from '../../models/patient';

const HealthRecord = ModelFactory.getByName(modelName);
const MessageFragment = ModelFactory.getByName(messageFragment);
const HealthRecordManifest = ModelFactory.getByName(healthRecordManifest);
const Patient = ModelFactory.getByName(patient);

export const getMessageFragmentByHealthRecordId = healthRecordId =>
  runWithinTransaction(transaction =>
    MessageFragment.findByHealthRecordId(healthRecordId, transaction)
  );

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
