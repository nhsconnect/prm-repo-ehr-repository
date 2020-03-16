import uuid from 'uuid/v4';
import ModelFactory from '../../index';

jest.mock('uuid/v4');

describe('HealthRecord - HealthRecordManifest associations', () => {
  const existingHealthRecordCovoId = '10489310-e97b-4744-8f3d-b7af1c47596d';
  const existingHealthRecordUUID = '1879b920-7174-4ef1-92f7-12383114b052';

  const testUUID = '213f3d25-c1e9-4024-8955-0d666f80fe41';

  const HealthRecordManifest = ModelFactory.getByName('HealthRecordManifest');
  const HealthRecord = ModelFactory.getByName('HealthRecord');
  const sequelize = ModelFactory.sequelize;

  const healthRecordConvoId = '8ab7f61f-0e6b-4378-8cac-dcb4f9e3ec54';
  const healthRecordUUID = '7d5712f2-d203-4f11-8527-1175db0d2a4a';

  const manifestMessageId1 = '03ba2531-42e3-4a70-82e6-df6fff52b226';
  const manifestMessageId2 = 'ae078243-59d8-4d21-b587-daac5d126f68';

  beforeEach(() => {
    uuid.mockImplementation(() => testUUID);
  });

  afterAll(() => {
    sequelize.close();
  });

  it('should get the health record from the health record manifest', () => {
    const healthRecordManifestMessageId = { message_id: manifestMessageId1 };
    manifestMessageId2;
    return sequelize.transaction().then(t =>
      HealthRecordManifest.findOne({ ...where(healthRecordManifestMessageId), transaction: t })
        .then(healthRecordManifest =>
          healthRecordManifest.getHealthRecord({ transaction: t }).then(healthRecord => {
            expect(healthRecord.get().id).toBe(healthRecordUUID);
            return expect(healthRecord.get().conversation_id).toBe(healthRecordConvoId);
          })
        )
        .finally(() => t.rollback())
    );
  });

  it('should get multiple health record manifest from health record', () => {
    const healthRecordConversationId = { conversation_id: healthRecordConvoId };

    return sequelize.transaction().then(t =>
      HealthRecord.findOne({ ...where(healthRecordConversationId), transaction: t })
        .then(healthRecord => {
          expect(healthRecord.get().id).toBe(healthRecordUUID);
          return healthRecord
            .getHealthRecordManifests({ paranoid: false, transaction: t })
            .then(healthRecordManifests => {
              expect(healthRecordManifests.length).toBe(2);
              expect(healthRecordManifests[0].get().message_id).toBe(manifestMessageId1);
              return expect(healthRecordManifests[1].get().message_id).toBe(manifestMessageId2);
            });
        })
        .finally(() => t.rollback())
    );
  });

  it('should create new health record and associate with new health record manifest', () => {
    const healthRecordConversationId = { conversation_id: testUUID };
    const newHealthRecordManifest = { message_id: testUUID };

    return sequelize.transaction().then(t =>
      HealthRecord.findOrCreate({ ...where(healthRecordConversationId), transaction: t })
        .then(healthRecord =>
          HealthRecordManifest.create(newHealthRecordManifest, { transaction: t }).then(
            healthRecordManifest => {
              healthRecordManifest.setHealthRecord(healthRecord[0].id, { transaction: t });
              return expect(healthRecordManifest.get().health_record_id).toBe(testUUID);
            }
          )
        )
        .finally(() => t.rollback())
    );
  });

  it('should find existing health record and associate with new health record manifest', () => {
    const healthRecordConversationId = { conversation_id: existingHealthRecordCovoId };
    const newHealthRecordManifest = { message_id: testUUID };

    return sequelize.transaction().then(t =>
      HealthRecord.findOrCreate({ ...where(healthRecordConversationId), transaction: t })
        .then(healthRecord =>
          HealthRecordManifest.create(newHealthRecordManifest, { transaction: t }).then(
            healthRecordManifest => {
              healthRecordManifest.setHealthRecord(healthRecord[0].id, { transaction: t });
              return expect(healthRecordManifest.get().health_record_id).toBe(
                existingHealthRecordUUID
              );
            }
          )
        )
        .finally(() => t.rollback())
    );
  });
});

const where = body => {
  return {
    where: body
  };
};
