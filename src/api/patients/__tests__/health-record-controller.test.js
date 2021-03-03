import request from 'supertest';
import { v4 as uuid } from 'uuid';
import app from '../../../app';
import {
  getHealthRecordStatus,
  HealthRecordStatus
} from '../../../services/database/health-record-repository';
import { initializeConfig } from '../../../config';

jest.mock('../../../services/database/health-record-repository');
jest.mock('../../../config', () => ({
  initializeConfig: jest.fn().mockReturnValue({ sequelize: { dialect: 'postgres' } })
}));

describe('healthRecordController', () => {
  initializeConfig.mockReturnValue({
    ehrRepoAuthKeys: 'correct-key'
  });

  const authorizationKeys = 'correct-key';

  describe('success', () => {
    it('should return 200 when a health record is complete', async () => {
      const nhsNumber = '1234567890';
      const conversationId = uuid();
      getHealthRecordStatus.mockResolvedValueOnce(HealthRecordStatus.COMPLETE);

      const res = await request(app)
        .get(`/new/patients/${nhsNumber}/health-records/${conversationId}`)
        .set('Authorization', authorizationKeys);

      expect(res.status).toEqual(200);
      expect(getHealthRecordStatus).toHaveBeenCalledWith(conversationId);
    });
  });

  describe('failure', () => {
    it('should return 404 when a health record is not complete', async () => {
      const nhsNumber = '1234567890';
      const conversationId = uuid();
      getHealthRecordStatus.mockResolvedValueOnce(HealthRecordStatus.PENDING);

      const res = await request(app)
        .get(`/new/patients/${nhsNumber}/health-records/${conversationId}`)
        .set('Authorization', authorizationKeys);

      expect(res.status).toEqual(404);
      expect(getHealthRecordStatus).toHaveBeenCalledWith(conversationId);
    });

    it('should return 404 when a health record is not found', async () => {
      const nhsNumber = '1234567890';
      const conversationId = uuid();
      getHealthRecordStatus.mockResolvedValueOnce(HealthRecordStatus.NOT_FOUND);

      const res = await request(app)
        .get(`/new/patients/${nhsNumber}/health-records/${conversationId}`)
        .set('Authorization', authorizationKeys);

      expect(res.status).toEqual(404);
      expect(getHealthRecordStatus).toHaveBeenCalledWith(conversationId);
    });

    it('should return 503 when there is an error retrieving the health record', async () => {
      const nhsNumber = '1234567890';
      const conversationId = uuid();
      getHealthRecordStatus.mockRejectedValue();

      const res = await request(app)
        .get(`/new/patients/${nhsNumber}/health-records/${conversationId}`)
        .set('Authorization', authorizationKeys);

      expect(res.status).toEqual(503);
      expect(getHealthRecordStatus).toHaveBeenCalledWith(conversationId);
    });
  });

  describe('validation', () => {
    it('should return 422 and an error message when conversationId is not a UUID', async () => {
      const conversationId = 'not-a-uuid';
      const nhsNumber = '1234567890';
      const errorMessage = { conversationId: "'conversationId' provided is not a UUID" };

      const res = await request(app)
        .get(`/new/patients/${nhsNumber}/health-records/${conversationId}`)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });

    it('should return 422 and an error message when nhsNumber is not numeric', async () => {
      const conversationId = uuid();
      const nhsNumber = 'not-valid';
      const errorMessage = { nhsNumber: "'nhsNumber' provided is not numeric" };

      const res = await request(app)
        .get(`/new/patients/${nhsNumber}/health-records/${conversationId}`)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });

    it('should return 422 and an error message when nhsNumber is not 10 characters', async () => {
      const conversationId = uuid();
      const nhsNumber = '123';
      const errorMessage = { nhsNumber: "'nhsNumber' provided is not 10 characters" };

      const res = await request(app)
        .get(`/new/patients/${nhsNumber}/health-records/${conversationId}`)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });
  });

  describe('authentication', () => {
    it('should return 401 when authentication keys are missing', async () => {
      const conversationId = uuid();
      const nhsNumber = '1234567890';

      const res = await request(app).get(
        `/new/patients/${nhsNumber}/health-records/${conversationId}`
      );

      expect(res.status).toBe(401);
    });

    it('should return 403 when authentication keys are incorrect', async () => {
      const conversationId = uuid();
      const nhsNumber = '1234567890';
      const res = await request(app)
        .get(`/new/patients/${nhsNumber}/health-records/${conversationId}`)
        .set('Authorization', 'incorrect');

      expect(res.status).toBe(403);
    });
  });
});
