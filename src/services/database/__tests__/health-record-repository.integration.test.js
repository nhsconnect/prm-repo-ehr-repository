import {
  markHealthRecordAsCompleted,
  retrieveHealthRecord,
  markHealthRecordFragmentsAsCompleted,
  markHealthRecordManifestAsCompleted
} from '../';

jest.mock('../../../middleware/logging');

describe('healthRecordRepository', () => {
  const conversationId = '3244a7bb-555e-433b-b2cc-1aa8178da99e';
  const healthRecordId = '99ba0ba1-ed1a-4fc1-ab5b-9d79af71aef4';

  describe('retrieveHealthRecord', () => {
    it('should retrieve health record by conversation id', () => {
      return retrieveHealthRecord(conversationId).then(healthRecord => {
        expect(healthRecord).not.toBeNull();
        return expect(healthRecord.get().conversation_id).toBe(conversationId);
      });
    });
  });

  describe('markHealthRecordAsCompleted', () => {
    it('should mark health record as complete where message is not large', () => {
      return markHealthRecordAsCompleted(conversationId).then(healthRecord => {
        expect(healthRecord.completed_at).not.toBeNull();
      });
    });
  });

  describe('markMessageFragmentAsCompleted', () => {
    it('should mark message fragments of health record as complete', () => {
      return markHealthRecordFragmentsAsCompleted(healthRecordId).then(messageFragment => {
        expect(messageFragment.completed_at).not.toBeNull();
      });
    });
  });

  describe('markHealthRecordManifestAsCompleted', () => {
    it('should mark manifest of health record as complete', () => {
      return markHealthRecordManifestAsCompleted(healthRecordId).then(manifest => {
        expect(manifest.completed_at).not.toBeNull();
      });
    });
  });
});
