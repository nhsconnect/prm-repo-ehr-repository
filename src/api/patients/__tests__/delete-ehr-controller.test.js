import request from 'supertest';
import { v4 as uuid } from 'uuid';
import app from '../../../app';
import {
  getCurrentHealthRecordIdForPatient,
  getHealthRecordMessageIds,
} from '../../../services/database/health-record-repository';
import { initializeConfig } from '../../../config';
import getSignedUrl from '../../../services/storage/get-signed-url';

jest.mock('../../../services/database/health-record-repository');
jest.mock('../../../middleware/logging');
jest.mock('../../../services/storage/get-signed-url');
jest.mock('../../../config', () => ({
  initializeConfig: jest.fn().mockReturnValue({ sequelize: { dialect: 'postgres' } }),
}));

describe('deleteEhrController', () => {
  initializeConfig.mockReturnValue({
    consumerApiKeys: { TEST_USER: 'correct-key' },
  });

  const authorizationKeys = 'correct-key';

  describe('success', () => {
    it('should return 200 when controller invoked correctly', async () => {
      const nhsNumber = '1234567890';
      const conversationId = uuid();
      const messageId = uuid();
      const presignedUrl = 'test-url';

      getCurrentHealthRecordIdForPatient.mockResolvedValue(conversationId);
      getHealthRecordMessageIds.mockResolvedValue({
        healthRecordExtractId: messageId,
        attachmentIds: [],
      });
      getSignedUrl.mockResolvedValue(presignedUrl);

      const res = await request(app)
        .delete(`/patients/${nhsNumber}`)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(200);
    });
  });

  // describe('failure', () => {
  //   const nhsNumber = '1234567890';
  //
  //   it('should return a 404 when no complete health record is found', async () => {
  //     getCurrentHealthRecordIdForPatient.mockReturnValue(undefined);
  //     const res = await request(app)
  //       .get(`/patients/${nhsNumber}`)
  //       .set('Authorization', authorizationKeys);
  //
  //     expect(res.status).toEqual(404);
  //     expect(logInfo).toHaveBeenCalledWith('Did not find a complete patient health record');
  //   });
  //
  //   it('should return a 503 when cannot get patient health record from database', async () => {
  //     getCurrentHealthRecordIdForPatient.mockRejectedValue({});
  //     const res = await request(app)
  //       .get(`/patients/${nhsNumber}`)
  //       .set('Authorization', authorizationKeys);
  //
  //     expect(res.status).toEqual(503);
  //     expect(logError).toHaveBeenCalledWith('Could not retrieve patient health record', {});
  //   });
  // });

  // describe('authentication', () => {
  //   it('should return 401 when authentication keys are missing', async () => {
  //     const nhsNumber = '1234567890';
  //     const res = await request(app).get(`/patients/${nhsNumber}`);
  //
  //     expect(res.status).toBe(401);
  //   });
  //
  //   it('should return 403 when authentication keys are incorrect', async () => {
  //     const nhsNumber = '1234567890';
  //     const res = await request(app)
  //       .get(`/patients/${nhsNumber}`)
  //       .set('Authorization', 'incorrect');
  //
  //     expect(res.status).toBe(403);
  //   });
  // });

  // describe('validation', () => {
  //   it('should return 422 and an error message when nhsNumber is not numeric', async () => {
  //     const nhsNumber = 'not-valid';
  //     const errorMessage = { nhsNumber: "'nhsNumber' provided is not numeric" };
  //
  //     const res = await request(app)
  //       .get(`/patients/${nhsNumber}`)
  //       .set('Authorization', authorizationKeys);
  //
  //     expect(res.status).toBe(422);
  //     expect(res.body.errors).toContainEqual(errorMessage);
  //   });
  //
  //   it('should return 422 and an error message when nhsNumber is not 10 characters', async () => {
  //     const nhsNumber = '123';
  //     const errorMessage = { nhsNumber: "'nhsNumber' provided is not 10 characters" };
  //
  //     const res = await request(app)
  //       .get(`/patients/${nhsNumber}`)
  //       .set('Authorization', authorizationKeys);
  //
  //     expect(res.status).toBe(422);
  //     expect(res.body.errors).toContainEqual(errorMessage);
  //   });
  // });
});
