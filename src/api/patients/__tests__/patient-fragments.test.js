import request from 'supertest';
import app from '../../../app';

jest.mock('../../../middleware/logging');
jest.mock('../../../middleware/auth');

describe('GET /patients', () => {
  describe('success', () => {
    const nhsNumber = '1111111111';
    it('should return 200', done => {
      request(app)
        .get(`/patients/${nhsNumber}/health-records/fragments`)
        .expect(200)
        .end(done);
    });
  });

  describe('validation for NHS Number', () => {
    it('should return 422 if nhsNumber is defined but not numeric', done => {
      const nhsNumber = 'not-numeric';
      request(app)
        .get(`/patients/${nhsNumber}/health-records/fragments`)
        .expect(422)
        .end(done);
    });

    it('should return an error when the NHS Number is not numeric', done => {
      const nhsNumber = 'not-numeric';
      request(app)
        .get(`/patients/${nhsNumber}/health-records/fragments`)
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
        .get(`/patients/${nhsNumber}/health-records/fragments`)
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
