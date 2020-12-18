import request from 'supertest';
import app from '../../../app';
import {
  getCurrentHealthRecordForPatient,
  getMessageFragmentByHealthRecordId
} from '../../../services/database';
import { logError } from '../../../middleware/logging';
import getSignedUrl from '../../../services/storage/get-signed-url';

jest.mock('../../../middleware/logging');
jest.mock('../../../middleware/auth');
jest.mock('../../../services/storage/get-signed-url');
jest.mock('../../../services/database', () => ({
  getCurrentHealthRecordForPatient: jest.fn(),
  getMessageFragmentByHealthRecordId: jest.fn()
}));

describe('GET /patients', () => {
  const nhsNumber = `1234567890`;
  const presignedUrl = 'fake-url';
  const healthRecordId = '7d5712f2-d203-4f11-8527-1175db0d2a4a';
  const conversationId = 'e300d50d-f163-4f0c-93a1-19581bc08711';
  const messageId = '59343e70-ad0a-4d1f-baf0-30d806948627';

  const testEndpoint = `/patients/${nhsNumber}`;
  const responseBody = {
    data: {
      type: 'patients',
      id: nhsNumber,
      links: {
        currentEhr: presignedUrl
      }
    }
  };
  describe('success', () => {
    beforeEach(() => {
      getCurrentHealthRecordForPatient.mockResolvedValue({
        dataValues: {
          id: healthRecordId,
          patient_id: 'e479ca12-4a7d-41cb-86a2-775f36b8a0d1',
          conversation_id: conversationId
        }
      });
      getMessageFragmentByHealthRecordId.mockReturnValue({
        dataValues: {
          message_id: messageId
        }
      });

      getSignedUrl.mockReturnValue(presignedUrl);
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
          expect(getMessageFragmentByHealthRecordId).toHaveBeenCalledWith(healthRecordId);
          expect(getSignedUrl).toHaveBeenCalledWith(
            conversationId.toUpperCase(),
            messageId.toUpperCase(),
            'getObject'
          );
        })
        .end(done);
    });
  });

  describe('not found', () => {
    it('should return 404 when patient health record not found', async () => {
      getCurrentHealthRecordForPatient.mockResolvedValue(null);

      const res = await request(app).get(testEndpoint);

      expect(res.status).toBe(404);
      expect(getMessageFragmentByHealthRecordId).not.toHaveBeenCalled();
      expect(getSignedUrl).not.toHaveBeenCalled();
    });

    it('should return 404 when message fragment not found', async () => {
      getCurrentHealthRecordForPatient.mockResolvedValue({
        dataValues: {
          id: '7d5712f2-d203-4f11-8527-1175db0d2a4a',
          conversation_id: 'E300D50D-F163-4F0C-93A1-19581BC08711'
        }
      });
      getMessageFragmentByHealthRecordId.mockResolvedValue(null);

      const res = await request(app).get(testEndpoint);
      expect(res.status).toBe(404);
      expect(getSignedUrl).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should return 500 when cannot retrieve health record', done => {
      getCurrentHealthRecordForPatient.mockRejectedValueOnce(Error('some-error'));
      request(app)
        .get(testEndpoint)
        .expect(500)
        .end(done);
    });

    it('should return error message when there is an error', done => {
      getCurrentHealthRecordForPatient.mockRejectedValueOnce(Error('some-error'));
      request(app)
        .get(testEndpoint)
        .expect(res => {
          expect(res.body).toEqual({ error: 'some-error' });
        })
        .end(done);
    });

    it('should logError when there is an error', done => {
      const error = Error('some-error');
      getCurrentHealthRecordForPatient.mockRejectedValueOnce(error);
      request(app)
        .get(testEndpoint)
        .expect(() => {
          expect(logError).toHaveBeenCalledTimes(1);
          expect(logError).toHaveBeenCalledWith('Error retrieving patient health record', error);
        })
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
