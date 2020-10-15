import request from 'supertest';
import app from '../../../app';
import {
  retrieveHealthRecord,
  markHealthRecordAsCompleted,
  markHealthRecordFragmentsAsCompleted,
  markHealthRecordManifestAsCompleted
} from '../../../services/database';
import { updateLogEventWithError } from '../../../middleware/logging';

jest.mock('../../../middleware/logging');
jest.mock('../../../middleware/auth');

jest.mock('../../../services/database/health-record-repository', () => ({
  retrieveHealthRecord: jest
    .fn()
    .mockReturnValue(Promise.resolve({ dataValues: { is_large_message: false } })),
  markHealthRecordAsCompleted: jest.fn(),
  markHealthRecordFragmentsAsCompleted: jest.fn(),
  markHealthRecordManifestAsCompleted: jest.fn()
}));

const conversationId = '25155ea7-d7da-4097-9324-a18952e72697';

describe('PATCH /fragments', () => {
  const testEndpoint = `/fragments`;

  describe('success', () => {
    it('should return 204', done => {
      request(app)
        .patch(testEndpoint)
        .send({
          transferComplete: true,
          conversationId: conversationId
        })
        .expect(204)
        .end(done);
    });

    it('should mark health record as completed when the health record is not large', done => {
      const healthRecordId = 'd5afe49d-78c6-4bac-88a8-794d20c481f9';
      let singleFileHealthRecord = { dataValues: { is_large_message: false, id: healthRecordId } };
      retrieveHealthRecord.mockReturnValue(Promise.resolve(singleFileHealthRecord));
      request(app)
        .patch(testEndpoint)
        .send({
          transferComplete: true,
          conversationId: conversationId
        })
        .expect(() => {
          expect(retrieveHealthRecord).toHaveBeenCalledWith(conversationId);
          expect(markHealthRecordAsCompleted).toHaveBeenCalledWith(conversationId);
          expect(markHealthRecordFragmentsAsCompleted).toHaveBeenCalledWith(healthRecordId);
          expect(markHealthRecordManifestAsCompleted).toHaveBeenCalledWith(healthRecordId);
        })
        .end(done);
    });

    it('should not mark health record as completed when the health record is large', done => {
      retrieveHealthRecord.mockReturnValue(
        Promise.resolve({ dataValues: { is_large_message: true } })
      );
      request(app)
        .patch(testEndpoint)
        .send({
          transferComplete: true,
          conversationId: conversationId
        })
        .expect(204)
        .expect(() => {
          expect(retrieveHealthRecord).toHaveBeenCalledWith(conversationId);
          expect(markHealthRecordAsCompleted).not.toHaveBeenCalled();
          expect(markHealthRecordFragmentsAsCompleted).not.toHaveBeenCalled();
          expect(markHealthRecordManifestAsCompleted).not.toHaveBeenCalled();
        })
        .end(done);
    });
  });

  describe('error', () => {
    it('should return 503 when cannot retrieve health record', done => {
      retrieveHealthRecord.mockRejectedValueOnce(Error('some-error'));
      request(app)
        .patch(testEndpoint)
        .send({
          transferComplete: true,
          conversationId: conversationId
        })
        .expect(503)
        .end(done);
    });

    it('should return error message when there is an error', done => {
      retrieveHealthRecord.mockRejectedValueOnce(Error('some-error'));
      request(app)
        .patch(testEndpoint)
        .send({
          transferComplete: true,
          conversationId: conversationId
        })
        .expect(res => {
          expect(updateLogEventWithError).toHaveBeenCalledTimes(1);
          expect(res.body).toEqual({ error: 'some-error' });
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
