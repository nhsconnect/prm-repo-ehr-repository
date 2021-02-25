import request from 'supertest';
import app from '../../../app';
import { getSignedUrl } from '../../../services/storage';
import { v4 as uuid } from 'uuid';
import { logError, logEvent } from '../../../middleware/logging';

jest.mock('../../../services/storage');
jest.mock('../../../middleware/auth');
jest.mock('../../../middleware/logging');

describe('messageLocationController', () => {
  describe('success', () => {
    const conversationId = uuid();
    const messageId = uuid();

    it('should return a 200 with presigned url in body', async () => {
      getSignedUrl.mockResolvedValue('presigned-url');

      const res = await request(app).get(`/messages/${conversationId}/${messageId}`);

      expect(res.status).toBe(200);
      expect(getSignedUrl).toHaveBeenCalledWith(conversationId, messageId, 'putObject');
      expect(res.text).toEqual('presigned-url');
      expect(logEvent).toHaveBeenCalledWith('Presigned URL sent successfully');
    });
  });

  describe('error', () => {
    const conversationId = uuid();
    const messageId = uuid();

    it('should return a 500 when getSignedUrl promise is rejected', async () => {
      const error = new Error('error');
      getSignedUrl.mockRejectedValueOnce(error);

      const res = await request(app).get(`/messages/${conversationId}/${messageId}`);

      expect(getSignedUrl).toHaveBeenCalledWith(conversationId, messageId, 'putObject');
      expect(logError).toHaveBeenCalledWith('Failed to retrieve pre-signed url', error);
      expect(res.status).toBe(500);
    });
  });

  describe('validation', () => {
    it('should return 422 and an error message when conversationId is not a UUID', async () => {
      const conversationId = 'not-a-uuid';
      const messageId = uuid();
      const errorMessage = [{ conversationId: "'conversationId' provided is not a UUID" }];

      const res = await request(app).get(`/messages/${conversationId}/${messageId}`);

      expect(res.status).toBe(422);
      expect(res.body).toEqual({
        errors: errorMessage
      });
    });

    it('should return 422 and an error message when messageId is not a UUID', async () => {
      const conversationId = uuid();
      const messageId = 'not-a-uuid';
      const errorMessage = [{ messageId: "'messageId' provided is not a UUID" }];

      const res = await request(app).get(`/messages/${conversationId}/${messageId}`);

      expect(res.status).toBe(422);
      expect(res.body).toEqual({
        errors: errorMessage
      });
    });
  });
});
