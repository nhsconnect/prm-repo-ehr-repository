import request from 'supertest';
import { v4 as uuid } from 'uuid';

import app from '../../../app';

describe('healthRecordLocationController', () => {
  const authorizationKeys = 'correct-key';

  beforeEach(() => {
    process.env.AUTHORIZATION_KEYS = authorizationKeys;
  });

  afterEach(() => {
    if (process.env.AUTHORIZATION_KEYS) {
      delete process.env.AUTHORIZATION_KEYS;
    }
  });

  describe('success', () => {
    const nhsNumber = '1234567890';
    const conversationId = uuid();

    it('should return 200', async () => {
      const res = await request(app)
        .get(`/new/patients/${nhsNumber}/health-records/${conversationId}`)
        .set('Authorization', authorizationKeys);

      expect(res.status).toEqual(200);
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
