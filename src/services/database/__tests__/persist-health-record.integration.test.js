import { logInfo, logError } from '../../../middleware/logging';
import ModelFactory from '../../../models';
import { createAndLinkEntries } from '../persist-health-record';
import { modelName } from '../../../models/message-fragment';
import { modelName as healthRecord } from '../../../models/health-record';
import { modelName as patient } from '../../../models/patient';

jest.mock('../../../middleware/logging');

describe('persistHealthRecord', () => {
  const sequelize = ModelFactory.sequelize;

  const MessageFragment = ModelFactory.getByName(modelName);
  const HealthRecord = ModelFactory.getByName(healthRecord);
  const Patient = ModelFactory.getByName(patient);

  const nhsNumber = '1234567890';
  const conversationId = '099cd501-034f-4e17-a461-cf4fd93ae0cf';
  const messageId = 'df13fc7b-89f7-4f80-b31c-b9720ac40296';
  const manifest = ['df13fc7b-89f7-4f80-b31c-b9720ac40296', '636c1aae-0fe5-4f46-9e99-a7d46ec55ef9'];
  const isLargeMessage = true;

  afterAll(() => sequelize.close());

  it('should call logInfo if data persisted correctly', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(nhsNumber, conversationId, isLargeMessage, messageId, manifest, t)
        .then(() => {
          expect(logInfo).toHaveBeenCalledTimes(1);
          return expect(logInfo).toHaveBeenCalledWith('Meta-data has been persisted');
        })
        .finally(() => t.rollback())
    );
  });

  it('should make message fragment with message id', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(nhsNumber, conversationId, isLargeMessage, messageId, manifest, t)
        .then(() =>
          MessageFragment.findOne({
            where: {
              message_id: messageId
            },
            transaction: t
          })
        )
        .then(fragment => {
          expect(fragment).not.toBeNull();
          return expect(fragment.get().message_id).toBe(messageId);
        })
        .finally(() => t.rollback())
    );
  });

  it('should make health record with conversation id', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(nhsNumber, conversationId, isLargeMessage, messageId, manifest, t)
        .then(() =>
          HealthRecord.findOne({
            where: {
              conversation_id: conversationId
            },
            transaction: t
          })
        )
        .then(healthRecord => {
          expect(healthRecord).not.toBeNull();
          return expect(healthRecord.get().conversation_id).toBe(conversationId);
        })
        .finally(() => t.rollback())
    );
  });

  it('should make patient with nhs number', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(nhsNumber, conversationId, isLargeMessage, messageId, manifest, t)
        .then(() =>
          Patient.findOne({
            where: {
              nhs_number: nhsNumber
            },
            transaction: t
          })
        )
        .then(patient => {
          expect(patient).not.toBeNull();
          return expect(patient.get().nhs_number).toBe(nhsNumber);
        })
        .finally(() => t.rollback())
    );
  });

  it('should not make patient when no nhs number given', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(null, conversationId, isLargeMessage, messageId, manifest, t)
        .then(() =>
          HealthRecord.findOne({
            where: {
              conversation_id: conversationId
            },
            transaction: t
          })
        )
        .then(healthRecord => {
          expect(healthRecord).not.toBeNull();
          return healthRecord.getPatient({ transaction: t });
        })
        .then(patient => {
          return expect(patient).toBeNull();
        })
        .finally(() => t.rollback())
    );
  });

  it('should propagate and log errors from invalid nhs number', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries('1234', conversationId, isLargeMessage, messageId, manifest, t)
        .catch(error => {
          expect(logError).toHaveBeenCalledTimes(1);
          expect(logError).toHaveBeenCalledWith(
            'Validation error: Validation len on nhs_number failed',
            expect.anything()
          );
          return expect(error.message).toContain('Validation len on nhs_number failed');
        })
        .finally(() => t.rollback())
    );
  });

  it('should propagate and log errors from invalid conversation id', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(nhsNumber, 'invalid', isLargeMessage, messageId, manifest, t)
        .catch(error => {
          expect(logError).toHaveBeenCalledTimes(1);
          expect(logError).toHaveBeenCalledWith(
            'invalid input syntax for type uuid: "invalid"',
            expect.anything()
          );
          return expect(error.message).toBe('invalid input syntax for type uuid: "invalid"');
        })
        .finally(() => t.rollback())
    );
  });

  it('should propagate and log errors from invalid message id', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(nhsNumber, conversationId, isLargeMessage, 'invalid', manifest, t)
        .catch(error => {
          expect(logError).toHaveBeenCalledTimes(1);
          expect(logError).toHaveBeenCalledWith(
            'invalid input syntax for type uuid: "invalid"',
            expect.anything()
          );
          return expect(error.message).toBe('invalid input syntax for type uuid: "invalid"');
        })
        .finally(() => t.rollback())
    );
  });

  it('should create association between message fragment and health record', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(nhsNumber, conversationId, isLargeMessage, messageId, manifest, t)
        .then(() =>
          MessageFragment.findOne({
            where: {
              message_id: messageId
            },
            transaction: t
          })
        )
        .then(fragment => {
          expect(fragment).not.toBeNull();
          return fragment.getHealthRecord({ transaction: t });
        })
        .then(healthRecord => {
          expect(healthRecord).not.toBeNull();
          return expect(healthRecord.get().conversation_id).toBe(conversationId);
        })
        .finally(() => t.rollback())
    );
  });

  it('should still associate fragment with health record if no manifest is given', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(nhsNumber, conversationId, isLargeMessage, messageId, [], t)
        .then(() =>
          MessageFragment.findOne({
            where: {
              message_id: messageId
            },
            transaction: t
          })
        )
        .then(fragment => {
          expect(fragment).not.toBeNull();
          return fragment.getHealthRecord({ transaction: t });
        })
        .then(healthRecord => {
          expect(healthRecord).not.toBeNull();
          return expect(healthRecord.get().conversation_id).toBe(conversationId);
        })
        .finally(() => t.rollback())
    );
  });

  it('should create association between health record and manifest', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(nhsNumber, conversationId, isLargeMessage, messageId, manifest, t)
        .then(() =>
          HealthRecord.findOne({
            where: {
              conversation_id: conversationId
            },
            transaction: t
          })
        )
        .then(healthRecord => {
          expect(healthRecord).not.toBeNull();
          return healthRecord.getHealthRecordManifests({ transaction: t });
        })
        .then(manifests => {
          expect(manifests).not.toBeNull();
          return expect(manifests[0].get().message_id).toBe(messageId);
        })
        .finally(() => t.rollback())
    );
  });

  it('should not associate manifest with health record if no manifest is given', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(nhsNumber, conversationId, isLargeMessage, messageId, [], t)
        .then(() =>
          HealthRecord.findOne({
            where: {
              conversation_id: conversationId
            },
            transaction: t
          })
        )
        .then(healthRecord => {
          expect(healthRecord).not.toBeNull();
          expect(healthRecord.get().conversation_id).toBe(conversationId);
          return healthRecord.getHealthRecordManifests({ transaction: t });
        })
        .then(manifests => {
          return expect(manifests.length).toBe(0);
        })
        .finally(() => t.rollback())
    );
  });

  it('should not create or associate with manifest if no manifest is given', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(nhsNumber, conversationId, isLargeMessage, messageId, [], t)
        .then(() =>
          MessageFragment.findOne({
            where: {
              message_id: messageId
            },
            transaction: t
          })
        )
        .then(fragment => {
          expect(fragment).not.toBeNull();
          return fragment.getHealthRecordManifests({ transaction: t });
        })
        .then(manifests => {
          return expect(manifests.length).toBe(0);
        })
        .finally(() => t.rollback())
    );
  });

  it('should not create or associate with manifest if manifest is null', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(nhsNumber, conversationId, isLargeMessage, messageId, null, t)
        .then(() =>
          MessageFragment.findOne({
            where: {
              message_id: messageId
            },
            transaction: t
          })
        )
        .then(fragment => {
          expect(fragment).not.toBeNull();
          return fragment.getHealthRecordManifests({ transaction: t });
        })
        .then(manifests => {
          return expect(manifests.length).toBe(0);
        })
        .finally(() => t.rollback())
    );
  });

  it('should get all message fragments from health record via manifest', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(nhsNumber, conversationId, isLargeMessage, messageId, manifest, t)
        .then(() =>
          HealthRecord.findOne({
            where: {
              conversation_id: conversationId
            },
            transaction: t
          })
        )
        .then(healthRecord => {
          expect(healthRecord.get().conversation_id).toBe(conversationId);
          return healthRecord.getHealthRecordManifests({ transaction: t });
        })
        .then(manifests => {
          expect(manifests.length).toBe(1);
          expect(manifests[0].get().message_id).toBe(messageId);
          return manifests[0].getMessageFragments({ transaction: t });
        })
        .then(fragments => {
          return expect(fragments.length).toBe(2);
        })
        .finally(() => t.rollback())
    );
  });
});
