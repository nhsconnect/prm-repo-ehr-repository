import request from 'supertest';
import app from '../../../app';

describe('patientDetailsController', () => {
  const authorizationKeys = 'correct-key';

  beforeEach(() => {
    process.env.AUTHORIZATION_KEYS = authorizationKeys;
  });

  afterEach(() => {
    if (process.env.AUTHORIZATION_KEYS) {
      delete process.env.AUTHORIZATION_KEYS;
    }
  });

  it('should return 200', async () => {
    const nhsNumber = '1234567890';
    const res = await request(app)
      .get(`/new/patients/${nhsNumber}`)
      .set('Authorization', authorizationKeys);

    expect(res.status).toBe(200);
  });

  describe('authentication', () => {
    it('should return 401 when authentication keys are missing', async () => {
      const nhsNumber = '1234567890';
      const res = await request(app).get(`/new/patients/${nhsNumber}`);

      expect(res.status).toBe(401);
    });

    it('should return 403 when authentication keys are incorrect', async () => {
      const nhsNumber = '1234567890';
      const res = await request(app)
        .get(`/new/patients/${nhsNumber}`)
        .set('Authorization', 'incorrect');

      expect(res.status).toBe(403);
    });
  });

  describe('validation', () => {
    it('should return 422 and an error message when nhsNumber is not numeric', async () => {
      const nhsNumber = 'not-valid';
      const errorMessage = { nhsNumber: "'nhsNumber' provided is not numeric" };

      const res = await request(app)
        .get(`/new/patients/${nhsNumber}`)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });

    it('should return 422 and an error message when nhsNumber is not 10 characters', async () => {
      const nhsNumber = '123';
      const errorMessage = { nhsNumber: "'nhsNumber' provided is not 10 characters" };

      const res = await request(app)
        .get(`/new/patients/${nhsNumber}`)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });
  });
});
