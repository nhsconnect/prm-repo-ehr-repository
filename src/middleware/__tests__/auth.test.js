import request from 'supertest';
import app from '../../app';

jest.mock('../logging');
jest.mock('../../services/database/persist-health-record', () => ({
  persistHealthRecord: jest.fn().mockReturnValue(Promise.resolve('Persisted'))
}));
jest.mock('../../services/storage/get-signed-url', () =>
  jest.fn().mockReturnValue(Promise.resolve('some-url'))
);

const conversationId = 'db4b773d-f171-4a5f-a23b-6a387f8792b7';
const messageId = '0809570a-3ae2-409c-a924-60766b39550f';

// In all other unit tests we want to pass through all of this logic and should therefore call jest.mock
// jest.mock('../auth') will call the manual mock in __mocks__ automatically
describe('auth', () => {
  beforeEach(() => {
    process.env.AUTHORIZATION_KEYS = 'correct-key';
  });

  afterEach(() => {
    if (process.env.AUTHORIZATION_KEYS) {
      delete process.env.AUTHORIZATION_KEYS;
    }
  });

  describe('authenticated successfully', () => {
    it('should return HTTP 201 when correctly authenticated', done => {
      request(app)
        .post(`/fragments`)
        .send({
          messageId,
          conversationId
        })
        .set('Authorization', 'correct-key')
        .expect(201)
        .end(done);
    });
  });

  describe('AUTHORIZATION_KEYS environment variables not provided', () => {
    beforeEach(() => {
      if (process.env.AUTHORIZATION_KEYS) {
        delete process.env.AUTHORIZATION_KEYS;
      }
    });

    it('should return 412 if AUTHORIZATION_KEYS have not been set', done => {
      request(app)
        .post(`/fragments`)
        .send({
          messageId,
          conversationId
        })
        .set('Authorization', 'correct-key')
        .expect(412)
        .end(done);
    });

    it('should return an explicit error message in the body if AUTHORIZATION_KEYS have not been set', done => {
      request(app)
        .post(`/fragments`)
        .send({
          messageId,
          conversationId
        })
        .set('Authorization', 'correct-key')
        .expect(res => {
          expect(res.body).toEqual(
            expect.objectContaining({
              error: 'Server-side Authorization keys have not been set, cannot authenticate'
            })
          );
        })
        .end(done);
    });
  });

  describe('Authorization header not provided', () => {
    it('should return HTTP 401 when no authorization header provided', done => {
      request(app)
        .post(`/fragments`)
        .send({
          messageId,
          conversationId
        })
        .expect(401)
        .end(done);
    });

    it('should return an explicit error message in the body when no authorization header provided', done => {
      request(app)
        .post(`/fragments`)
        .send({
          messageId,
          conversationId
        })
        .expect(res => {
          expect(res.body).toEqual(
            expect.objectContaining({
              error: 'The request (/fragments) requires a valid Authorization header to be set'
            })
          );
        })
        .end(done);
    });
  });

  describe('incorrect Authorisation header value provided ', () => {
    it('should return HTTP 403 when authorization key is incorrect', done => {
      request(app)
        .post(`/fragments`)
        .send({
          messageId,
          conversationId
        })
        .set('Authorization', 'incorrect-key')
        .expect(403)
        .end(done);
    });

    it('should return an explicit error message in the body when authorization key is incorrect', done => {
      request(app)
        .post(`/fragments`)
        .send({
          messageId,
          conversationId
        })
        .set('Authorization', 'incorrect-key')
        .expect(res => {
          expect(res.body).toEqual(
            expect.objectContaining({
              error: 'Authorization header is provided but not valid'
            })
          );
        })
        .end(done);
    });
  });

  describe('should only authenticate with exact value of the auth key', () => {
    it('should return HTTP 403 when authorization key is incorrect', done => {
      request(app)
        .post(`/fragments`)
        .send({
          messageId,
          conversationId
        })
        .set('Authorization', 'co')
        .expect(403)
        .end(done);
    });

    it('should return HTTP 403 when authorization key is partial string', done => {
      process.env.AUTHORIZATION_KEYS = 'correct-key,other-key';
      request(app)
        .post(`/fragments`)
        .send({
          messageId,
          conversationId
        })
        .set('Authorization', 'correct-key')
        .expect(403)
        .end(done);
    });

    it('should return HTTP 201 when authorization keys have a comma but are one string ', done => {
      process.env.AUTHORIZATION_KEYS = 'correct-key,other-key';
      request(app)
        .post(`/fragments`)
        .send({
          messageId,
          conversationId
        })
        .set('Authorization', 'correct-key,other-key')
        .expect(201)
        .end(done);
    });
  });
});
