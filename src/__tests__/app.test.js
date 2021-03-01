import request from 'supertest';
import app from '../app';
import ModelFactory from '../models';

jest.mock('../middleware/logging');

jest.mock('../services/database/persist-health-record', () => ({
  persistHealthRecord: jest.fn().mockReturnValue(Promise.resolve('Persisted'))
}));

jest.mock('../services/database/health-record-repository', () => ({
  retrieveHealthRecord: jest
    .fn()
    .mockReturnValue(Promise.resolve({ dataValues: { is_large_message: false } })),
  markHealthRecordAsCompleted: jest.fn(),
  markHealthRecordFragmentsAsCompleted: jest.fn(),
  markHealthRecordManifestAsCompleted: jest.fn()
}));

jest.mock('../services/storage/get-signed-url', () =>
  jest.fn().mockReturnValue(Promise.resolve('some-url'))
);

jest.mock('../middleware/auth');
jest.mock('../services/get-health-check');

describe('app', () => {
  afterAll(() => {
    ModelFactory.sequelize.close();
  });

  describe('GET /', () => {
    it('should return a 404 status code', done => {
      request(app)
        .get('/')
        .expect(404)
        .end(done);
    });
  });

  describe('GET /any-text - an unspecified endpoint', () => {
    it('should return a 404 status code', done => {
      request(app)
        .get('/any-text')
        .expect(404)
        .end(done);
    });
  });

  describe('Swagger Documentation', () => {
    it('GET /swagger - should return a 301 status code (redirect) and text/html content type response', done => {
      request(app)
        .get('/swagger')
        .expect(301)
        .expect('Content-Type', 'text/html; charset=UTF-8')
        .end(done);
    });

    it('GET /swagger/index.html - should return a 200 status code and text/html content type response', done => {
      request(app)
        .get('/swagger/index.html')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=UTF-8')
        .end(done);
    });
  });
});
