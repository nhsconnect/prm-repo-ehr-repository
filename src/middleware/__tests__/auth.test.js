import request from 'supertest';
import app from '../../app';
import { v4 as uuid } from 'uuid';

jest.mock('../logging');
jest.mock('../../services/storage/get-signed-url', () =>
  jest.fn().mockReturnValue(Promise.resolve('some-url'))
);

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

  const conversationId = uuid();
  const messageId = uuid();

  describe('authenticated successfully', () => {
    it('should return HTTP 302 when correctly authenticated', async () => {
      const res = await request(app)
        .get(`/messages/${conversationId}/${messageId}`)
        .set('Authorization', 'correct-key');
      expect(res.status).toBe(200);
    });
  });

  describe('AUTHORIZATION_KEYS environment variables not provided', () => {
    beforeEach(() => {
      if (process.env.AUTHORIZATION_KEYS) {
        delete process.env.AUTHORIZATION_KEYS;
      }
    });

    it('should return 412 if AUTHORIZATION_KEYS have not been set', async () => {
      const res = await request(app)
        .get(`/messages/${conversationId}/${messageId}`)
        .set('Authorization', 'correct-key');
      expect(res.status).toBe(412);
    });

    it('should return an explicit error message in the body if AUTHORIZATION_KEYS have not been set', async () => {
      const res = await request(app)
        .get(`/messages/${conversationId}/${messageId}`)
        .set('Authorization', 'correct-key');
      expect(res.body).toEqual(
        expect.objectContaining({
          error: 'Server-side Authorization keys have not been set, cannot authenticate'
        })
      );
    });
  });

  describe('Authorization header not provided', () => {
    it('should return HTTP 401 when no authorization header provided', async () => {
      const res = await request(app).get(`/messages/${conversationId}/${messageId}`);
      expect(res.status).toBe(401);
    });

    it('should return an explicit error message in the body when no authorization header provided', async () => {
      const res = await request(app).get(`/messages/${conversationId}/${messageId}`);
      expect(res.body).toEqual({
        error: 'The request (/messages) requires a valid Authorization header to be set'
      });
    });
  });

  describe('incorrect Authorisation header value provided ', () => {
    it('should return HTTP 403 when authorization key is incorrect', async () => {
      const res = await request(app)
        .get(`/messages/${conversationId}/${messageId}`)
        .set('Authorization', 'incorrect-key');
      expect(res.status).toBe(403);
    });

    it('should return an explicit error message in the body when authorization key is incorrect', async () => {
      const res = await request(app)
        .get(`/messages/${conversationId}/${messageId}`)
        .set('Authorization', 'incorrect-key');
      expect(res.body).toEqual(
        expect.objectContaining({
          error: 'Authorization header is provided but not valid'
        })
      );
    });
  });

  describe('should only authenticate with exact value of the auth key', () => {
    it('should return HTTP 403 when authorization key is incorrect', async () => {
      const res = await request(app)
        .get(`/messages/${conversationId}/${messageId}`)
        .set('Authorization', 'co');
      expect(res.status).toBe(403);
    });

    it('should return HTTP 403 when authorization key is partial string', async () => {
      process.env.AUTHORIZATION_KEYS = 'correct-key,other-key';
      const res = await request(app)
        .get(`/messages/${conversationId}/${messageId}`)
        .set('Authorization', 'correct-key');
      expect(res.status).toBe(403);
    });

    it('should return HTTP 302 and be successful when authorization keys have a comma but are one string ', async () => {
      process.env.AUTHORIZATION_KEYS = 'correct-key,other-key';
      const res = await request(app)
        .get(`/messages/${conversationId}/${messageId}`)
        .set('Authorization', 'correct-key,other-key');
      expect(res.status).toBe(200);
    });
  });
});
