import ModelFactory from '../../index';
import uuid from 'uuid/v4';

jest.mock('uuid/v4');

describe('HealthRecord - MessageFragment associations', () => {
  const existingHealthRecordCovoId = '10489310-e97b-4744-8f3d-b7af1c47596d';
  const existingHealthRecordUUID = '1879b920-7174-4ef1-92f7-12383114b052';

  const testUUID = '213f3d25-c1e9-4024-8955-0d666f80fe41';

  const MessageFragment = ModelFactory.getByName('MessageFragment');
  const HealthRecord = ModelFactory.getByName('HealthRecord');
  const sequelize = ModelFactory.sequelize;

  const healthRecordConvoId = '3244a7bb-555e-433b-b2cc-1aa8178da99e';
  const healthRecordUUID = '99ba0ba1-ed1a-4fc1-ab5b-9d79af71aef4';
  const messageFragmentMessageId1 = '8c0f741e-82fa-46f1-9686-23a1c08657f1';
  const messageFragmentMessageId2 = '5cff6bcf-98ea-4c60-8f65-4b0240324284';
  const messageFragmentMessageId3 = '6f1ad957-aa63-404c-80c5-97d8a73cb5ea';

  beforeEach(() => {
    uuid.mockImplementation(() => testUUID);
  });

  afterAll(() => {
    sequelize.close();
  });

  it('should get the health record from the message fragment', () => {
    const fragmentMessageId = { message_id: messageFragmentMessageId1 };

    return sequelize.transaction().then(t =>
      MessageFragment.findOne({ ...where(fragmentMessageId), transaction: t })
        .then(messageFragment =>
          messageFragment.getHealthRecord({ transaction: t }).then(healthRecord => {
            expect(healthRecord.get().id).toBe(healthRecordUUID);
            return expect(healthRecord.get().conversation_id).toBe(healthRecordConvoId);
          })
        )
        .finally(() => t.rollback())
    );
  });

  it('should get multiple message fragments from health record', () => {
    const healthRecordConversationId = { conversation_id: healthRecordConvoId };

    return sequelize.transaction().then(t =>
      HealthRecord.findOne({ ...where(healthRecordConversationId), transaction: t })
        .then(healthRecord => {
          expect(healthRecord.get().id).toBe(healthRecordUUID);
          return healthRecord
            .getMessageFragments({ paranoid: false, transaction: t })
            .then(messageFragments => {
              const messageFragmentsIds = messageFragments.map(
                fragment => fragment.get().message_id
              );
              expect(messageFragments.length).toBe(3);
              expect(messageFragmentsIds).toContain(messageFragmentMessageId1);
              expect(messageFragmentsIds).toContain(messageFragmentMessageId2);
              return expect(messageFragmentsIds).toContain(messageFragmentMessageId3);
            });
        })
        .finally(() => t.rollback())
    );
  });

  it('should create new health record and associate with new message fragment', () => {
    const healthFragmentConversationId = { conversation_id: testUUID };
    const newMessageFragment = { message_id: testUUID };

    return sequelize.transaction().then(t =>
      HealthRecord.findOrCreate({ ...where(healthFragmentConversationId), transaction: t })
        .then(healthRecord =>
          MessageFragment.create(newMessageFragment, { transaction: t }).then(messageFragment => {
            messageFragment.setHealthRecord(healthRecord[0].id, { transaction: t });
            return expect(messageFragment.get().health_record_id).toBe(testUUID);
          })
        )
        .finally(() => t.rollback())
    );
  });

  it('should find existing health record and associate with new message fragment', () => {
    const healthRecordConversationId = { conversation_id: existingHealthRecordCovoId };
    const newMessageFragment = { message_id: testUUID };

    return sequelize.transaction().then(t =>
      HealthRecord.findOrCreate({ ...where(healthRecordConversationId), transaction: t })
        .then(healthRecord =>
          MessageFragment.create(newMessageFragment, { transaction: t }).then(messageFragment => {
            messageFragment.setHealthRecord(healthRecord[0].id, { transaction: t });
            return expect(messageFragment.get().health_record_id).toBe(existingHealthRecordUUID);
          })
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
