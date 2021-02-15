import { v4 as uuid } from 'uuid';
import request from 'supertest';
import app from '../../../app';

describe('storeMessageController', () => {
  const conversationId = uuid();
  const nhsNumber = '1234567890';
  const messageId = uuid();
  const messageType = 'ehrExtract';
  const attachmentMessageIds = [];
  const requestBody = {
    data: {
      type: 'messages',
      id: messageId,
      attributes: {
        conversationId,
        messageType,
        nhsNumber,
        attachmentMessageIds
      }
    }
  };

  describe('success', () => {
    it('should return a 201 when message has successfully been stored in database', async () => {
      const res = await request(app)
        .post('/messages')
        .send(requestBody);

      expect(res.status).toBe(201);
    });
  });

  describe('validation', () => {
    it('should return 422 and an error message when conversationId is not a UUID', async () => {
      const requestBody = {
        data: {
          attributes: {
            conversationId: 'not-a-uuid'
          }
        }
      };
      const errorMessage = {
        'data.attributes.conversationId': "'conversationId' provided is not a UUID"
      };

      const res = await request(app)
        .post('/messages')
        .send(requestBody);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });

    it('should return 422 and an error message when messageId is not a UUID', async () => {
      const requestBody = {
        data: {
          id: 'not-a-uuid'
        }
      };
      const errorMessage = { 'data.id': "'id' provided is not a UUID" };

      const res = await request(app)
        .post('/messages')
        .send(requestBody);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });

    it('should return 422 and an error message when type is not messages', async () => {
      const requestBody = {
        data: {
          type: 'not-messages'
        }
      };
      const errorMessage = { 'data.type': 'Invalid value' };

      const res = await request(app)
        .post('/messages')
        .send(requestBody);

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
            messageType: 'ehrExtract'
          }
        }
      };
      const errorMessage = { 'data.attributes.nhsNumber': "'nhsNumber' provided is not numeric" };

      const res = await request(app)
        .post('/messages')
        .send(requestBody);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });

    it('should return 422 and an error message when nhsNumber is not 10 digits long', async () => {
      const requestBody = {
        data: {
          attributes: {
            nhsNumber: '1234567890987654',
            messageType: 'ehrExtract'
          }
        }
      };
      const errorMessage = {
        'data.attributes.nhsNumber': "'nhsNumber' provided is not 10 characters"
      };

      const res = await request(app)
        .post('/messages')
        .send(requestBody);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });

    it('should return 422 and an error message when messageType is not recognised', async () => {
      const requestBody = {
        data: {
          attributes: {
            messageType: 'not-a-message-type'
          }
        }
      };
      const errorMessage = {
        'data.attributes.messageType':
          "'messageType' provided is not one of the following: ehrExtract, attachment"
      };

      const res = await request(app)
        .post('/messages')
        .send(requestBody);

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
            messageType: 'ehrExtract'
          }
        }
      };

      const res = await request(app)
        .post('/messages')
        .send(requestBody);

      expect(res.status).toBe(201);
    });

    it('should return 422 and an error message when nhsNumber has not been provided for messageType ehrExtract', async () => {
      const requestBody = {
        data: {
          attributes: {
            messageType: 'ehrExtract'
          }
        }
      };

      const errorMessage = {
        'data.attributes.nhsNumber': "'nhsNumber' is required for messageType ehrExtract"
      };

      const res = await request(app)
        .post('/messages')
        .send(requestBody);

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
            messageType: 'ehrExtract'
          }
        }
      };
      const res = await request(app)
        .post('/messages')
        .send(requestBody);

      expect(res.status).toBe(201);
    });

    it('should return 422 and an error message when nhsNumber has been provided for messageType attachment', async () => {
      const requestBody = {
        data: {
          attributes: {
            nhsNumber: '1234567890',
            messageType: 'attachment'
          }
        }
      };

      const errorMessage = {
        'data.attributes.nhsNumber': "'nhsNumber' should be empty for messageType attachment"
      };

      const res = await request(app)
        .post('/messages')
        .send(requestBody);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });

    it('should return 201 when nhsNumber has not been provided for messageType attachment', async () => {
      const requestBody = {
        data: {
          type: 'messages',
          id: uuid(),
          attributes: {
            conversationId: uuid(),
            messageType: 'attachment'
          }
        }
      };

      const res = await request(app)
        .post('/messages')
        .send(requestBody);

      expect(res.status).toBe(201);
    });

    it('should return 422 and an error message when attachmentMessageIds is not uuids', async () => {
      const requestBody = {
        data: {
          attributes: {
            attachmentMessageIds: ['not-a-uuid']
          }
        }
      };

      const errorMessage = {
        'data.attributes.attachmentMessageIds[0]': "'attachmentMessageIds' should be UUIDs"
      };

      const res = await request(app)
        .post('/messages')
        .send(requestBody);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });

    it('should return 422 and an error message when attachmentMessageIds is not an array', async () => {
      const requestBody = {
        data: {
          attributes: {
            attachmentMessageIds: 'not-an-array'
          }
        }
      };

      const errorMessage = {
        'data.attributes.attachmentMessageIds': "'attachmentMessageIds' should be an array"
      };

      const res = await request(app)
        .post('/messages')
        .send(requestBody);

      expect(res.status).toBe(422);
      expect(res.body.errors).toContainEqual(errorMessage);
    });
  });
});
