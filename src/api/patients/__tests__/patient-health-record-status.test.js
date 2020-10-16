import dateFormat from 'dateformat';
import request from 'supertest';
import app from '../../../app';
import { retrieveHealthRecord } from '../../../services/database';

jest.mock('../../../middleware/logging');
jest.mock('../../../middleware/auth');

const completedAt = dateFormat(Date.now(), 'yyyymmddHHMMss');

jest.mock('../../../services/database/health-record-repository', () => ({
  retrieveHealthRecord: jest.fn()
}));

describe('GET /patients/:nhsNumber/health-records/:conversationId', () => {
  const nhsNumber = '1234567890';
  const conversationId = '0caffb6f-d7cd-460e-8505-2c4d6f77bd04';
  const testEndpoint = `/patients/${nhsNumber}/health-records/${conversationId}`;
  const body = {
    data: {
      type: 'health-record',
      id: conversationId,
      attributes: {
        status: 'success',
        completed_at: completedAt
      }
    }
  };
  const pendingBody = {
    data: {
      type: 'health-record',
      id: conversationId,
      attributes: {
        status: 'pending',
        completed_at: null
      }
    }
  };

  describe('success', () => {
    it('should return 200', done => {
      retrieveHealthRecord.mockReturnValue(
        Promise.resolve({ dataValues: { completed_at: completedAt } })
      );
      request(app)
        .get(testEndpoint)
        .expect(200)
        .expect(res => {
          expect(res.body).toEqual(body);
        })
        .end(done);
    });

    it('should return 200 when status is pending', done => {
      retrieveHealthRecord.mockReturnValue(Promise.resolve({ dataValues: { completed_at: null } }));
      request(app)
        .get(testEndpoint)
        .expect(200)
        .expect(res => {
          expect(res.body).toEqual(pendingBody);
        })
        .end(done);
    });
  });

  describe('error', () => {
    it('should return 404', done => {
      retrieveHealthRecord.mockReturnValue(Promise.resolve(null));
      request(app)
        .get(testEndpoint)
        .expect(404)
        .end(done);
    });
  });

  describe('validations', () => {
    it('should return 422 if nhsNumber is defined but not numeric', done => {
      const incorrectConversationId = 'not-numeric';
      request(app)
        .get(`/patients/${incorrectConversationId}/health-records/${conversationId}`)
        .expect(422)
        .end(done);
    });

    it('should return 422 if conversation ID is defined but not uuid', done => {
      const incorrectConversationId = 'not-uuid';
      request(app)
        .get(`/patients/${nhsNumber}/health-records/${incorrectConversationId}`)
        .expect(422)
        .end(done);
    });
  });
});
