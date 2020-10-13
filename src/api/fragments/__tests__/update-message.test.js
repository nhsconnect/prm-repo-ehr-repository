import request from 'supertest';
import app from '../../../app';
import { retrieveHealthRecord, markHealthRecordAsCompleted } from '../../../services/database';

jest.mock('../../../middleware/logging');
jest.mock('../../../middleware/auth');

jest.mock('../../../services/database/health-record-repository', () => ({
  retrieveHealthRecord: jest
    .fn()
    .mockReturnValue(Promise.resolve({ dataValues: { is_large_message: false } })),
  markHealthRecordAsCompleted: jest.fn()
}));

describe('PATCH /fragments', () => {
  const testEndpoint = `/fragments`;

  describe('success', () => {
    it('should return 204', done => {
      request(app)
        .patch(testEndpoint)
        .send({
          transferComplete: true,
          conversationId: '3244a7bb-555e-433b-b2cc-1aa8178da99e'
        })
        .expect(204)
        .end(done);
    });

    it('should mark health record as completed when the health record is not large', done => {
      let conversationId = '3244a7bb-555e-433b-b2cc-1aa8178da99e';
      request(app)
        .patch(testEndpoint)
        .send({
          transferComplete: true,
          conversationId: conversationId
        })
        .expect(() => {
          expect(retrieveHealthRecord).toHaveBeenCalledWith(conversationId);
          expect(markHealthRecordAsCompleted).toHaveBeenCalledWith(conversationId);
        })
        .end(done);
    });
  });

  describe('validation for transferComplete', () => {
    it('should return 422 if transferComplete is not provided in body', done => {
      request(app)
        .patch(testEndpoint)
        .send()
        .expect(422)
        .end(done);
    });

    it('should return error message if transferComplete is not provided in body', done => {
      request(app)
        .patch(testEndpoint)
        .send()
        .expect(res => {
          expect(res.body).toEqual({
            errors: expect.arrayContaining([{ transferComplete: 'Invalid value' }])
          });
        })
        .end(done);
    });
  });

  describe('validation for conversationId', () => {
    it('should return 422 if conversationId is not provided in body', done => {
      request(app)
        .patch(testEndpoint)
        .send({
          transferComplete: true
        })
        .expect(422)
        .end(done);
    });

    it('should return error message if conversationId is not provided in body', done => {
      request(app)
        .patch(testEndpoint)
        .send({
          transferComplete: true
        })
        .expect(res => {
          expect(res.body).toEqual({
            errors: expect.arrayContaining([{ conversationId: 'Invalid value' }])
          });
        })
        .end(done);
    });
  });
});
