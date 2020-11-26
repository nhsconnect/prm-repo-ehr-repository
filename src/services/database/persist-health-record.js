import ModelFactory from '../../models';
import { logEvent, logError } from '../../middleware/logging';

const sequelize = ModelFactory.sequelize;
const MessageFragment = ModelFactory.getByName('MessageFragment');

export const createAndLinkEntries = (
  nhsNumber,
  conversationId,
  isLargeMessage,
  messageId,
  manifest,
  transaction
) =>
  MessageFragment.findOrCreateOne(messageId, transaction)
    .then(fragment =>
      Array.isArray(manifest) && manifest.length
        ? fragment.containsManifest(messageId, manifest, transaction)
        : fragment
    )
    .then(fragment => fragment.withHealthRecord(conversationId, isLargeMessage, transaction))
    .then(fragment => fragment.getHealthRecord({ transaction: transaction }))
    .then(healthRecord =>
      nhsNumber === undefined || nhsNumber === null
        ? healthRecord
        : healthRecord.withPatient(nhsNumber, transaction)
    )
    .then(healthRecord =>
      Array.isArray(manifest) && manifest.length
        ? healthRecord.hasManifest(messageId, transaction)
        : healthRecord
    )
    .then(() => logEvent('Meta-data has been persisted'))
    .catch(err => {
      logError(err.message, err);
      throw err;
    });

export const persistHealthRecord = (
  nhsNumber,
  conversationId,
  isLargeMessage,
  messageId,
  manifest
) =>
  sequelize.transaction().then(transaction =>
    createAndLinkEntries(
      nhsNumber,
      conversationId,
      isLargeMessage,
      messageId,
      manifest,
      transaction
    )
      .then(() => transaction.commit())
      .catch(error => {
        transaction.rollback();
        throw error;
      })
  );
