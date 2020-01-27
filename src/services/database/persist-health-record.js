import ModelFactory from '../../models';
import { updateLogEvent, updateLogEventWithError } from '../../middleware/logging';

const sequelize = ModelFactory.sequelize;
const MessageFragment = ModelFactory.getByName('MessageFragment');

export const createAndLinkEntries = (nhsNumber, conversationId, messageId, manifest, transaction) =>
  MessageFragment.findOrCreateOne(messageId, transaction)
    .then(fragment => {
      return Array.isArray(manifest) && manifest.length
        ? fragment.containsManifest(messageId, manifest, transaction)
        : fragment;
    })
    .then(fragment => fragment.withHealthRecord(conversationId, transaction))
    .then(fragment => fragment.getHealthRecord({ transaction: transaction }))
    .then(healthRecord => healthRecord.withPatient(nhsNumber, transaction))
    // TODO: .then(healthRecord => healthRecord.hasManifest(messageId, transaction))
    .then(() => updateLogEvent({ status: 'Meta-data has been persisted' }))
    .catch(error => {
      updateLogEventWithError(error);
      throw error;
    });

// Tests
// Existing patient
// Existing health record (patient)
// Existing manifest (health record and patient)
// Existing message fragment (manifest, health-record, patient)
// Null manifest
// Empty manifest
// Manifest self
// Test valid navigation with manifest
// Test valid navigation without manifest (already exists)
export const persistHealthRecord = (nhsNumber, conversationId, messageId, manifest) =>
  sequelize.transaction().then(transaction =>
    createAndLinkEntries(nhsNumber, conversationId, messageId, manifest, transaction)
      .then(() => transaction.commit())
      .catch(() => transaction.rollback())
  );
