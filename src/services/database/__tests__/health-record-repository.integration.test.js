import {
  markHealthRecordAsCompleted,
  retrieveHealthRecord,
  markHealthRecordFragmentsAsCompleted,
  markHealthRecordManifestAsCompleted
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
});
