import {
  markHealthRecordAsCompleted,
  retrieveHealthRecord,
  markHealthRecordFragmentsAsCompleted,
  markHealthRecordManifestAsCompleted,
  getCurrentHealthRecordForPatient,
  getHealthRecordByPatientId,
  getPatientByNhsNumber
} from '../';
import ModelFactory from '../../../models';
import { runWithinTransaction } from '../helper';

jest.mock('../../../middleware/logging');

describe('healthRecordRepository', () => {
  const sequelize = ModelFactory.sequelize;
  const conversationId = '3244a7bb-555e-433b-b2cc-1aa8178da99e';
  const healthRecordId = '99ba0ba1-ed1a-4fc1-ab5b-9d79af71aef4';
  const HealthRecord = ModelFactory.getByName('HealthRecord');
  const MessageFragment = ModelFactory.getByName('MessageFragment');
  const HealthRecordManifest = ModelFactory.getByName('HealthRecordManifest');
  afterAll(() => sequelize.close());

  describe('retrieveHealthRecord', () => {
    it('should retrieve health record by conversation id', () => {
      return retrieveHealthRecord(conversationId).then(healthRecord => {
        expect(healthRecord).not.toBeNull();
        return expect(healthRecord.get().conversation_id).toBe(conversationId);
      });
    });
  });

  describe('markHealthRecordAsCompleted', () => {
    it('should mark health record as complete where message is not large', async () => {
      await markHealthRecordAsCompleted(conversationId);
      const healthRecord = await runWithinTransaction(transaction =>
        HealthRecord.findOne({
          where: {
            conversation_id: conversationId
          },
          transaction: transaction
        })
      );

      expect(healthRecord.completed_at).not.toBeNull();
    });
  });

  describe('markMessageFragmentAsCompleted', () => {
    it('should mark message fragments of health record as complete', async () => {
      await markHealthRecordFragmentsAsCompleted(healthRecordId);
      const messageFragment = await runWithinTransaction(transaction =>
        MessageFragment.findOne({
          where: {
            health_record_id: healthRecordId
          },
          transaction: transaction
        })
      );
      expect(messageFragment.completed_at).not.toBeNull();
    });
  });

  describe('markHealthRecordManifestAsCompleted', () => {
    it('should mark manifest of health record as complete', async () => {
      await markHealthRecordManifestAsCompleted(healthRecordId);
      const healthRecordManifest = await runWithinTransaction(transaction =>
        HealthRecordManifest.findOne({
          where: {
            health_record_id: healthRecordId
          },
          transaction: transaction
        })
      );
      expect(healthRecordManifest.completed_at).not.toBeNull();
    });
  });

  describe('getCurrentHealthRecordForPatient', () => {
    it('should retrieve correct health record for patient', async () => {
      const existingNhsNumber = '1111111111';
      const expectedHealthRecordId = `7d5712f2-d203-4f11-8527-1175db0d2a4a`;
      const expectedConversationId = '8ab7f61f-0e6b-4378-8cac-dcb4f9e3ec54';

      return getCurrentHealthRecordForPatient(existingNhsNumber).then(healthRecord => {
        expect(healthRecord).not.toBeNull();
        expect(healthRecord.get().id).toBe(expectedHealthRecordId);
        expect(healthRecord.get().conversation_id).toBe(expectedConversationId);
      });
    });
  });

  describe('getPatientByNhsNumber', () => {
    const existingNhsNumber = '1111111111';
    const expectedPatientId = 'e479ca12-4a7d-41cb-86a2-775f36b8a0d1';

    it('should retrieve patient by nhs number', () => {
      return getPatientByNhsNumber(existingNhsNumber).then(patient => {
        expect(patient).not.toBeNull();
        return expect(patient.get().id).toBe(expectedPatientId);
      });
    });
  });

  describe('getHealthRecordByPatientId', () => {
    const existingPatientId = 'e479ca12-4a7d-41cb-86a2-775f36b8a0d1';
    const expectedHealthRecordId = `7d5712f2-d203-4f11-8527-1175db0d2a4a`;

    it('should retrieve patient by nhs number', () => {
      return getHealthRecordByPatientId(existingPatientId).then(healthRecord => {
        expect(healthRecord).not.toBeNull();
        return expect(healthRecord.get().id).toBe(expectedHealthRecordId);
      });
    });
  });
});
