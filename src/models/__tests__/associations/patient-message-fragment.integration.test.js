import ModelFactory from '../../index';
import { modelName } from '../../message-fragment';
import { modelName as patient } from '../../patient';

describe('Patient - MessageFragment navigation', () => {
  const MessageFragment = ModelFactory.getByName(modelName);
  const Patient = ModelFactory.getByName(patient);
  const sequelize = ModelFactory.sequelize;

  const testPatientUUID = 'e479ca12-4a7d-41cb-86a2-775f36b8a0d1';
  const testPatientNHSNumber = '1111111111';

  const testHealthRecordUUID = '7d5712f2-d203-4f11-8527-1175db0d2a4a';
  const testHealthRecordConvoId = '8ab7f61f-0e6b-4378-8cac-dcb4f9e3ec54';

  const testFragmentUUID1 = '1856e953-b336-4385-81c6-fc6d7bc6b846';
  const testFragmentMessageId1 = '4b677d19-f13f-488a-84ac-57f6948b34fe';

  const testFragmentUUID2 = '4dd0193f-6ab9-47f5-8cce-e5506d466702';
  const testFragmentMessageId2 = 'b829bc94-58d5-4481-99e1-8cc1afacae06';

  afterAll(() => {
    sequelize.close();
  });

  it('should be able to get patient from message fragment', () => {
    const messageFragmentMessageId = { message_id: testFragmentMessageId1 };

    return sequelize.transaction().then(t =>
      MessageFragment.findOne({ ...where(messageFragmentMessageId), transaction: t })
        .then(messageFragment => {
          expect(messageFragment.get().id).toBe(testFragmentUUID1);
          return messageFragment.getHealthRecord({ transaction: t });
        })
        .then(healthRecord => {
          expect(healthRecord.get().id).toBe(testHealthRecordUUID);
          expect(healthRecord.get().conversation_id).toBe(testHealthRecordConvoId);
          return healthRecord.getPatient({ transaction: t });
        })
        .then(patient => {
          expect(patient.get().id).toBe(testPatientUUID);
          return expect(patient.get().nhs_number).toBe(testPatientNHSNumber);
        })
        .finally(() => t.rollback())
    );
  });

  it('should be able to get get multiple fragments for a patient', () => {
    const patientNhsNumber = { nhs_number: testPatientNHSNumber };

    return sequelize.transaction().then(t =>
      Patient.findOne({ ...where(patientNhsNumber), transaction: t })
        .then(patient => {
          expect(patient.get().id).toBe(testPatientUUID);
          return patient.getHealthRecords({ transaction: t });
        })
        .then(healthRecords => {
          expect(healthRecords[0].get().id).toBe(testHealthRecordUUID);
          expect(healthRecords[0].get().conversation_id).toBe(testHealthRecordConvoId);
          return healthRecords[0].getMessageFragments({ transaction: t });
        })
        .then(messageFragments => {
          expect(messageFragments.length).toBe(2);
          expect(messageFragments[0].get().id).toBe(testFragmentUUID1);
          expect(messageFragments[0].get().message_id).toBe(testFragmentMessageId1);
          expect(messageFragments[1].get().id).toBe(testFragmentUUID2);
          return expect(messageFragments[1].get().message_id).toBe(testFragmentMessageId2);
        })
        .finally(() => t.rollback())
    );
  });
});

const where = body => {
  return {
    where: body
  };
};
