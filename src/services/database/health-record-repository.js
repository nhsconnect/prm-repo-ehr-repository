import ModelFactory from '../../models';
import { runWithinTransaction } from './helper';

const HealthRecord = ModelFactory.getByName('HealthRecord');
const MessageFragment = ModelFactory.getByName('MessageFragment');
const HealthRecordManifest = ModelFactory.getByName('HealthRecordManifest');

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
