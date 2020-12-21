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
import { getMessageFragmentByHealthRecordId } from '../health-record-repository';
import { modelName } from '../../../models/health-record';
import { modelName as messageFragment } from '../../../models/message-fragment';
import { modelName as healthRecordManifest } from '../../../models/health-record-manifest';

jest.mock('../../../middleware/logging');

describe('healthRecordRepository', () => {
  const sequelize = ModelFactory.sequelize;
  const conversationId = '3244a7bb-555e-433b-b2cc-1aa8178da99e';
  const healthRecordId = '99ba0ba1-ed1a-4fc1-ab5b-9d79af71aef4';
  const HealthRecord = ModelFactory.getByName(modelName);
  const MessageFragment = ModelFactory.getByName(messageFragment);
  const HealthRecordManifest = ModelFactory.getByName(healthRecordManifest);
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
      const existingNhsNumber = '5555555555';
      const expectedHealthRecordId = 'e66716d2-3208-4ef6-88b5-6a77f16125f5';
      const expectedConversationId = '6952c28c-b806-44f9-9b06-6bfe2e99dcba';

      return getCurrentHealthRecordForPatient(existingNhsNumber).then(healthRecord => {
        expect(healthRecord).not.toBeNull();
        expect(healthRecord.get().id).toBe(expectedHealthRecordId);
        expect(healthRecord.get().conversation_id).toBe(expectedConversationId);
      });
    });

    it('should return null for a patient that does not exist', async () => {
      const missingNhsNumber = '0009991112';

      return getCurrentHealthRecordForPatient(missingNhsNumber).then(healthRecord => {
        expect(healthRecord).toBeNull();
      });
    });
  });

  describe('getPatientByNhsNumber', () => {
    const existingNhsNumber = '5555555555';
    const missingNhsNumber = '0009991112';
    const expectedPatientId = 'd316b74f-5338-434d-9268-760781a04835';

    it('should retrieve patient by nhs number', () => {
      return getPatientByNhsNumber(existingNhsNumber).then(patient => {
        expect(patient).not.toBeNull();
        return expect(patient.get().id).toBe(expectedPatientId);
      });
    });

    it('should return null if patient cannot be found', () => {
      return getPatientByNhsNumber(missingNhsNumber).then(patient => {
        expect(patient).toBeNull();
      });
    });
  });

  describe('getHealthRecordByPatientId', () => {
    const existingPatientId = 'd316b74f-5338-434d-9268-760781a04835';
    const expectedHealthRecordId = 'e66716d2-3208-4ef6-88b5-6a77f16125f5';

    it('should retrieve most recent complete health record if patient exists', () => {
      return getHealthRecordByPatientId(existingPatientId).then(healthRecord => {
        expect(healthRecord).not.toBeNull();
        return expect(healthRecord.get().id).toBe(expectedHealthRecordId);
      });
    });

    it('should return null if cannot find a complete health record', () => {
      const missingPatientId = '85cf0816-2911-4c84-868f-46fe0056e3ae';
      return getHealthRecordByPatientId(missingPatientId).then(healthRecord => {
        expect(healthRecord).toBeNull();
      });
    });
  });

  describe('getMessageFragmentByHealthRecordId', () => {
    it('should retrieve message fragment for a given health record id', async () => {
      const healthRecordId = '04523969-6679-4ac8-8222-c226ff7a155f';
      const expectedMessageId = 'dc0626d8-bb01-4b94-a044-9b9322b52634';
      const messageFragment = await getMessageFragmentByHealthRecordId(healthRecordId);
      expect(messageFragment.get().message_id).toBe(expectedMessageId);
    });

    it('should return null if cannot find a message fragment with health record id', async () => {
      const missingHealthRecordId = 'E44C075D-FD45-4CEF-A14C-472435B1F232';
      const messageFragment = await getMessageFragmentByHealthRecordId(missingHealthRecordId);
      expect(messageFragment).toBeNull();
    });
  });
});
