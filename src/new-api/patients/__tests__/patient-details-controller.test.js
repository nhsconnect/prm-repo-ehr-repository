import request from 'supertest';
import app from '../../../app';

describe('patientDetailsController', () => {
  const nhsNumber = '1234567890';

  it('should return 200', async () => {
    const res = await request(app).get(`/new/patients/${nhsNumber}`);
    expect(res.status).toBe(200);
  });
});
