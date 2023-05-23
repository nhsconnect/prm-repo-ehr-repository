import { v4 as uuid } from 'uuid';
import request from 'supertest';
import app from '../../../app';
import {
  updateAttachmentAndCreateItsParts,
  createEhrExtract,
  createAttachmentPart,
  attachmentExists,
} from '../../../services/database/message-repository';
import {
  updateHealthRecordCompleteness,
  getHealthRecordStatus,
} from '../../../services/database/health-record-repository';
import { initializeConfig } from '../../../config';
import { logError } from '../../../middleware/logging';
import { MessageType } from '../../../models/message';

jest.mock('../../../services/database/message-repository');
jest.mock('../../../services/database/health-record-repository');
jest.mock('../../../middleware/logging');
jest.mock('../../../config', () => ({
  initializeConfig: jest.fn().mockReturnValue({ sequelize: { dialect: 'postgres' } }),
}));

describe('storeMessageController', () => {
  initializeConfig.mockReturnValue({
    consumerApiKeys: { TEST_USER: 'correct-key' },
  });

  const authorizationKeys = 'correct-key';
  const conversationId = uuid();
  const nhsNumber = '1234567890';
  const messageId = uuid();
  const attachmentMessageIds = [uuid()];

  describe('success', () => {
    let requestBody;

    beforeEach(() => {
      requestBody = {
        data: {
          type: 'messages',
          id: messageId,
          attributes: {
            conversationId,
            messageType: MessageType.EHR_EXTRACT,
            nhsNumber,
            attachmentMessageIds,
          },
        },
      };
    });

    it('should return a 201 and health record status when message has successfully been stored in database', async () => {
      getHealthRecordStatus.mockResolvedValueOnce('complete');
      const ehrExtract = { messageId, conversationId, nhsNumber, attachmentMessageIds };
      const res = await request(app)
        .post('/messages')
        .send(requestBody)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ healthRecordStatus: 'complete' });
      expect(createEhrExtract).toHaveBeenCalledWith(ehrExtract);
      expect(updateHealthRecordCompleteness).toHaveBeenCalledWith(conversationId);
      expect(getHealthRecordStatus).toHaveBeenCalledWith(conversationId);
    });

    it('should update receivedAt for given attachment and store its parts', async () => {
      const attachmentPartId = uuid();
      requestBody.data.attributes = {
        messageType: MessageType.FRAGMENT,
        conversationId,
        attachmentMessageIds: [attachmentPartId],
      };

      attachmentExists.mockResolvedValueOnce(true);

      const res = await request(app)
        .post('/messages')
        .send(requestBody)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(201);
      expect(createEhrExtract).not.toHaveBeenCalled();
      expect(updateAttachmentAndCreateItsParts).toHaveBeenCalledWith(messageId, conversationId, [
        attachmentPartId,
      ]);
      expect(updateHealthRecordCompleteness).toHaveBeenCalledWith(conversationId);
    });

    it('should create message in the database when an attachment part arrives before first attachment part', async () => {
      const attachmentPartId = uuid();
      requestBody.data.id = attachmentPartId;
      requestBody.data.attributes = {
        messageType: MessageType.FRAGMENT,
        conversationId,
        attachmentMessageIds: [],
      };

      attachmentExists.mockResolvedValueOnce(false);

      const res = await request(app)
        .post('/messages')
        .send(requestBody)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(201);
      expect(attachmentExists).toHaveBeenCalledWith(attachmentPartId);
      expect(createAttachmentPart).toHaveBeenCalledWith(attachmentPartId, conversationId);
      expect(updateAttachmentAndCreateItsParts).not.toHaveBeenCalled();
      expect(updateHealthRecordCompleteness).toHaveBeenCalledWith(conversationId);
    });
  });

  describe('failure', () => {
    const requestBody = {
      data: {
        type: 'messages',
        id: messageId,
        attributes: {
          conversationId,
          messageType: MessageType.EHR_EXTRACT,
          nhsNumber,
          attachmentMessageIds,
        },
      },
    };
    it('should return a 503 when message cannot be stored in the database', async () => {
      createEhrExtract.mockRejectedValueOnce({ error: 'db is down' });
      const res = await request(app)
        .post('/messages')
        .send(requestBody)
        .set('Authorization', authorizationKeys);

      expect(logError).toHaveBeenCalledWith(
        'Returned 503 due to error while saving message',
        expect.anything()
      );
      expect(res.status).toBe(503);
    });
  });

  describe('validation', () => {
    it('should return 422 and an error message when conversationId is not a UUID', async () => {
      const requestBody = {
        data: {
          attributes: {
            conversationId: 'not-a-uuid',
          },
        },
      };
      const errorMessage = {
        'data.attributes.conversationId': "'conversationId' provided is not a UUID",
      };

      const res = await request(app)
        .post('/messages')
        .send(requestBody)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });

    it('should return 422 and an error message when messageId is not a UUID', async () => {
      const requestBody = {
        data: {
          id: 'not-a-uuid',
        },
      };
      const errorMessage = { 'data.id': "'id' provided is not a UUID" };

      const res = await request(app)
        .post('/messages')
        .send(requestBody)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });

    it('should return 422 and an error message when type is not messages', async () => {
      const requestBody = {
        data: {
          type: 'not-messages',
        },
      };
      const errorMessage = { 'data.type': 'Invalid value' };

      const res = await request(app)
        .post('/messages')
        .send(requestBody)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });

    it('should return 422 and an error message when nhsNumber is not numeric', async () => {
      const requestBody = {
        data: {
          type: 'messages',
          id: uuid(),
          attributes: {
            conversationId: uuid(),
            nhsNumber: 'not-an-nhs-number',
            messageType: 'ehrExtract',
          },
        },
      };
      const errorMessage = { 'data.attributes.nhsNumber': "'nhsNumber' provided is not numeric" };

      const res = await request(app)
        .post('/messages')
        .send(requestBody)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });

    it('should return 422 and an error message when nhsNumber is not 10 digits long', async () => {
      const requestBody = {
        data: {
          attributes: {
            nhsNumber: '1234567890987654',
            messageType: 'ehrExtract',
          },
        },
      };
      const errorMessage = {
        'data.attributes.nhsNumber': "'nhsNumber' provided is not 10 characters",
      };

      const res = await request(app)
        .post('/messages')
        .send(requestBody)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });

    it('should return 422 and an error message when messageType is not recognised', async () => {
      const requestBody = {
        data: {
          attributes: {
            messageType: 'not-a-message-type',
          },
        },
      };
      const errorMessage = {
        'data.attributes.messageType':
          "'messageType' provided is not one of the following: ehrExtract, fragment",
      };

      const res = await request(app)
        .post('/messages')
        .send(requestBody)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });

    it('should return 201 when messageType is recognised', async () => {
      const requestBody = {
        data: {
          type: 'messages',
          id: uuid(),
          attributes: {
            conversationId: uuid(),
            nhsNumber: '1234567890',
            messageType: 'ehrExtract',
            attachmentMessageIds: [],
          },
        },
      };

      const res = await request(app)
        .post('/messages')
        .send(requestBody)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(201);
    });

    it('should return 422 and an error message when nhsNumber has not been provided for messageType ehrExtract', async () => {
      const requestBody = {
        data: {
          attributes: {
            messageType: 'ehrExtract',
          },
        },
      };

      const errorMessage = {
        'data.attributes.nhsNumber': "'nhsNumber' is required for messageType ehrExtract",
      };

      const res = await request(app)
        .post('/messages')
        .send(requestBody)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });

    it('should return 201 when nhsNumber has been provided for messageType ehrExtract', async () => {
      const requestBody = {
        data: {
          type: 'messages',
          id: uuid(),
          attributes: {
            conversationId: uuid(),
            nhsNumber: '1234567890',
            messageType: 'ehrExtract',
            attachmentMessageIds: [],
          },
        },
      };
      const res = await request(app)
        .post('/messages')
        .send(requestBody)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(201);
    });

    it('should return 422 and an error message when nhsNumber has been provided for messageType fragment', async () => {
      const requestBody = {
        data: {
          attributes: {
            nhsNumber: '1234567890',
            messageType: 'fragment',
          },
        },
      };

      const errorMessage = {
        'data.attributes.nhsNumber': "'nhsNumber' should be empty for messageType fragment",
      };

      const res = await request(app)
        .post('/messages')
        .send(requestBody)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });

    it('should return 201 when nhsNumber has not been provided for messageType fragment', async () => {
      const requestBody = {
        data: {
          type: 'messages',
          id: uuid(),
          attributes: {
            conversationId: uuid(),
            messageType: 'fragment',
            attachmentMessageIds: [],
          },
        },
      };

      const res = await request(app)
        .post('/messages')
        .send(requestBody)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(201);
    });

    it('should return 422 and an error message when attachmentMessageIds is not uuids', async () => {
      const requestBody = {
        data: {
          attributes: {
            attachmentMessageIds: ['not-a-uuid'],
          },
        },
      };

      const errorMessage = {
        'data.attributes.attachmentMessageIds[0]': "'attachmentMessageIds' should be UUIDs",
      };

      const res = await request(app)
        .post('/messages')
        .send(requestBody)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });

    it('should return 422 and an error message when attachmentMessageIds is not an array', async () => {
      const requestBody = {
        data: {
          attributes: {
            attachmentMessageIds: 'not-an-array',
          },
        },
      };

      const errorMessage = {
        'data.attributes.attachmentMessageIds': "'attachmentMessageIds' should be an array",
      };

      const res = await request(app)
        .post('/messages')
        .send(requestBody)
        .set('Authorization', authorizationKeys);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });
  });

  describe('authentication', () => {
    const requestBody = {
      data: {
        type: 'messages',
        id: uuid(),
        attributes: {
          conversationId: uuid(),
          nhsNumber: '1234567890',
          messageType: 'ehrExtract',
        },
      },
    };

    it('should return 401 when authentication keys are missing', async () => {
      const res = await request(app).post('/messages').send(requestBody);

      expect(res.status).toBe(401);
    });

    it('should return 403 when authentication keys are incorrect', async () => {
      const res = await request(app)
        .post('/messages')
        .send(requestBody)
        .set('Authorization', 'incorrect');

      expect(res.status).toBe(403);
    });
  });
});
