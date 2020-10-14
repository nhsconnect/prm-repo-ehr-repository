import {markHealthRecordAsCompleted, retrieveHealthRecord} from "../";

jest.mock('../../../middleware/logging');

describe('healthRecordRepository', () => {
  const conversationId = '3244a7bb-555e-433b-b2cc-1aa8178da99e';

  describe('retrieveHealthRecord', () => {
    it('should retrieve health record by conversation id', () => {
        return retrieveHealthRecord(conversationId)
          .then(healthRecord => {
            expect(healthRecord).not.toBeNull();
            return expect(healthRecord.get().conversation_id).toBe(conversationId);
          })
    });
  });

  describe('markHealthRecordAsCompleted', () => {
    it('should retrieve mark health record as complete where message is not large', () => {
      return markHealthRecordAsCompleted(conversationId)
          .then(healthRecord => {
            expect(healthRecord.completed_at).not.toBeNull();
          });
    });
  });
});
