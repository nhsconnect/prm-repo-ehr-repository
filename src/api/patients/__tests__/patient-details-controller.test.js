import request from 'supertest';
import { when } from 'jest-when';
import { v4 as uuid } from 'uuid';
import app from '../../../app';
import {
  getCurrentHealthRecordIdForPatient,
  getHealthRecordMessageIds,
} from '../../../services/database/health-record-repository';
import { initializeConfig } from '../../../config';
import { logError, logInfo } from '../../../middleware/logging';
import getSignedUrl from '../../../services/storage/get-signed-url';

jest.mock('../../../services/database/health-record-repository');
jest.mock('../../../middleware/logging');
jest.mock('../../../services/storage/get-signed-url');
jest.mock('../../../config', () => ({
  initializeConfig: jest.fn().mockReturnValue({ sequelize: { dialect: 'postgres' } }),
}));

describe('patientDetailsController', () => {
  initializeConfig.mockReturnValue({
    consumerApiKeys: { TEST_USER: 'correct-key' },
  });

  const authorizationKeys = 'correct-key';

  describe('success', () => {
    it('should return 200 and correct link to health record extract given a small record', async () => {
      const nhsNumber = '1234567890';
      const conversationId = uuid();
      const messageId = uuid();
      const presignedUrl = 'test-url';

      getCurrentHealthRecordIdForPatient.mockResolvedValue(conversationId);
      getHealthRecordMessageIds.mockResolvedValue({
        coreMessageId: messageId,
        fragmentMessageIds: [],
      });
      getSignedUrl.mockResolvedValue(presignedUrl);

      const res = await request(app)
        .get(`/patients/${nhsNumber}`)
        .set({'Authorization': authorizationKeys, 'conversationId': conversationId});

      expect(res.status).toBe(200);
      expect(getCurrentHealthRecordIdForPatient).toHaveBeenCalledWith(nhsNumber);
      expect(getSignedUrl).toHaveBeenCalledWith(conversationId, messageId, 'getObject');
      expect(res.body.coreMessageUrl).toEqual(presignedUrl);
      expect(res.body.fragmentMessageIds).toEqual([]);
      expect(res.body.conversationIdFromEhrIn).toEqual(conversationId);
    });

    it('should return 200 and correct link to health record extract and fragment message IDs', async () => {
      const nhsNumber = '1234567890';
      const conversationId = uuid();
      const healthRecordExtractId = uuid();
      const fragmentMessageId = uuid();
      const extractPresignedUrl = 'extract-url';

      getCurrentHealthRecordIdForPatient.mockResolvedValue(conversationId);
      getHealthRecordMessageIds.mockResolvedValue({
        coreMessageId: healthRecordExtractId,
        fragmentMessageIds: [fragmentMessageId],
      });
      when(getSignedUrl)
        .calledWith(conversationId, healthRecordExtractId, 'getObject')
        .mockResolvedValue(extractPresignedUrl);

      const res = await request(app)
        .get(`/patients/${nhsNumber}`)
        .set({'Authorization': authorizationKeys, 'conversationId': conversationId});

      expect(res.status).toBe(200);
      expect(getCurrentHealthRecordIdForPatient).toHaveBeenCalledWith(nhsNumber);
      expect(getSignedUrl).toHaveBeenCalledWith(conversationId, healthRecordExtractId, 'getObject');
      expect(getSignedUrl).not.toHaveBeenCalledWith(conversationId, fragmentMessageId, 'getObject');
      expect(res.body.coreMessageUrl).toEqual(extractPresignedUrl);
      expect(res.body.fragmentMessageIds).toEqual([fragmentMessageId]);
      expect(res.body.conversationIdFromEhrIn).toEqual(conversationId);
    });
  });

  describe('failure', () => {
    const nhsNumber = '1234567890';
    const conversationId = 'fake-conversationId';

    it('should return a 404 when no complete health record is found', async () => {
      getCurrentHealthRecordIdForPatient.mockReturnValue(undefined);
      const res = await request(app)
        .get(`/patients/${nhsNumber}`)
        .set({'Authorization': authorizationKeys, 'conversationId': conversationId});

      expect(res.status).toEqual(404);
      expect(logInfo).toHaveBeenCalledWith('Did not find a complete patient health record');
    });

    it('should return a 503 when cannot get patient health record from database', async () => {
      getCurrentHealthRecordIdForPatient.mockRejectedValue({ bob: 'cheese' });
      const res = await request(app)
        .get(`/patients/${nhsNumber}`)
        .set({'Authorization': authorizationKeys, 'conversationId': conversationId});


      expect(res.status).toEqual(503);
      expect(logError).toHaveBeenCalledWith('Could not retrieve patient health record', {
        bob: 'cheese',
      });
    });

    it('should return 400 when conversation id is not passed as header', async () => {
      getCurrentHealthRecordIdForPatient.mockReturnValue(undefined);
      const res = await request(app)
          .get(`/patients/${nhsNumber}`)
          .set({'Authorization': authorizationKeys});

      expect(res.status).toEqual(400);
      expect(logError).toHaveBeenCalledWith('conversationId not passed as header');
    })
  });

  describe('authentication', () => {
    it('should return 401 when authentication keys are missing', async () => {
      const nhsNumber = '1234567890';
      const res = await request(app).get(`/patients/${nhsNumber}`);

      expect(res.status).toBe(401);
    });

    it('should return 403 when authentication keys are incorrect', async () => {
      const nhsNumber = '1234567890';
      const res = await request(app)
        .get(`/patients/${nhsNumber}`)
        .set('Authorization', 'incorrect');

      expect(res.status).toBe(403);
    });
  });

  describe('validation', () => {
    it('should return 422 and an error message when nhsNumber is not numeric', async () => {
      const nhsNumber = 'not-valid';
      const errorMessage = { nhsNumber: "'nhsNumber' provided is not numeric" };

      const res = await request(app)
        .get(`/patients/${nhsNumber}`)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });

    it('should return 422 and an error message when nhsNumber is not 10 characters', async () => {
      const nhsNumber = '123';
      const errorMessage = { nhsNumber: "'nhsNumber' provided is not 10 characters" };

      const res = await request(app)
        .get(`/patients/${nhsNumber}`)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });
  });
});
