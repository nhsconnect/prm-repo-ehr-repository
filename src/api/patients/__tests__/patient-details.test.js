import request from 'supertest';
import app from '../../../app';
import { getCurrentHealthRecordForPatient } from '../../../services/database';

jest.mock('../../../middleware/logging');
jest.mock('../../../middleware/auth');
jest.mock('../../../services/database', () => ({
  getCurrentHealthRecordForPatient: jest.fn()
}));

describe('GET /patients', () => {
  const nhsNumber = `1234567890`;
  const conversationId = '123-123';
  const testEndpoint = `/patients/${nhsNumber}`;
  const responseBody = {
    data: {
      type: 'patient',
      id: nhsNumber,
      attributes: {
        conversationId
      }
    }
  };

  describe('success', () => {
    beforeEach(() => {
      getCurrentHealthRecordForPatient.mockResolvedValue({ conversation_id: conversationId });
    });

    it('should return 200', done => {
      request(app)
        .get(testEndpoint)
        .expect(200)
        .end(done);
    });

    it('should return current health record', done => {
      request(app)
        .get(testEndpoint)
        .expect(res => {
          expect(res.body).toEqual(responseBody);
          expect(getCurrentHealthRecordForPatient).toHaveBeenCalledWith(nhsNumber);
        })
        .end(done);
    });
  });

  describe('patient health record not found', () => {
    it('should return 404', done => {
      getCurrentHealthRecordForPatient.mockResolvedValue(null);

      request(app)
        .get(testEndpoint)
        .expect(404)
        .end(done);
    });
  });

  describe('validation for NHS Number', () => {
    it('should return 422 if nhsNumber is defined but not numeric', done => {
      const nhsNumber = 'not-numeric';
      request(app)
        .get(`/patients/${nhsNumber}`)
        .expect(422)
        .end(done);
    });

    it('should return an error when the NHS Number is not numeric', done => {
      const nhsNumber = 'not-numeric';
      request(app)
        .get(`/patients/${nhsNumber}`)
        .expect(res => {
          expect(res.body).toEqual({
            errors: expect.arrayContaining([{ nhsNumber: "'nhsNumber' provided is not numeric" }])
          });
        })
        .end(done);
    });

    it('should return an error when the NHS Number is not 10 characters', done => {
      const nhsNumber = '123';
      request(app)
        .get(`/patients/${nhsNumber}`)
        .expect(res => {
          expect(res.body).toEqual({
            errors: expect.arrayContaining([
              { nhsNumber: "'nhsNumber' provided is not 10 characters" }
            ])
          });
        })
        .end(done);
    });
  });
});
