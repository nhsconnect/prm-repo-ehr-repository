import ModelFactory from '../../models';
import { updateLogEvent, updateLogEventWithError } from '../../middleware/logging';

const sequelize = ModelFactory.sequelize;
const MessageFragment = ModelFactory.getByName('MessageFragment');

export const createAndLinkEntries = (nhsNumber, conversationId, messageId, manifest, transaction) =>
  MessageFragment.findOrCreateOne(messageId, transaction)
    .then(fragment =>
      Array.isArray(manifest) && manifest.length
        ? fragment.containsManifest(messageId, manifest, transaction)
        : fragment)
    .then(fragment => fragment.withHealthRecord(conversationId, transaction))
    .then(fragment => fragment.getHealthRecord({ transaction: transaction }))
    .then(healthRecord =>
      (nhsNumber === undefined || nhsNumber === null)
        ? healthRecord
        : healthRecord.withPatient(nhsNumber, transaction))
    .then(healthRecord =>
      Array.isArray(manifest) && manifest.length
        ? healthRecord.hasManifest(messageId, transaction)
        : healthRecord)
    .then(() => updateLogEvent({ status: 'Meta-data has been persisted' }))
    .catch(error => {
      updateLogEventWithError(error);
      throw error;
    });

export const persistHealthRecord = (nhsNumber, conversationId, messageId, manifest) =>
  sequelize.transaction().then(transaction =>
    createAndLinkEntries(nhsNumber, conversationId, messageId, manifest, transaction)
      .then(() => transaction.commit())
      .catch(error => {
        transaction.rollback();
        throw error;
      })
  );
