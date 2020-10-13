import ModelFactory from '../../models';
import { runWithinTransaction } from './helper';

const HealthRecord = ModelFactory.getByName('HealthRecord');

export const retrieveHealthRecord = conversationId =>
  runWithinTransaction(transaction =>
    HealthRecord.findByConversationId(conversationId, transaction)
  );

export const markHealthRecordAsCompleted = conversationId =>
  runWithinTransaction(transaction =>
    HealthRecord.complete({ where: { conversation_id: conversationId }, transaction })
  );
