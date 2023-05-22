import request from 'supertest';
import app from '../../../app';
import { getSignedUrl } from '../../../services/storage';
import { v4 as uuid } from 'uuid';
import { logError, logInfo } from '../../../middleware/logging';
import { initializeConfig } from '../../../config';
import { messageAlreadyReceived } from '../../../services/database/health-record-repository';

jest.mock('../../../services/storage');
jest.mock('../../../services/database/health-record-repository');
jest.mock('../../../middleware/logging');
jest.mock('../../../config', () => ({
    initializeConfig: jest.fn().mockReturnValue({ sequelize: { dialect: 'postgres' } }),
}));

describe('getFragmentController', () => {
    initializeConfig.mockReturnValue({
        consumerApiKeys: {TEST_USER: 'correct-key'},
    });

    const authorizationKeys = 'correct-key';

    describe('success', () => {
        it('should return a 200 with presigned url in body', async () => {
            // given
            const conversationId = uuid();
            const messageId = uuid();
            const presignedUrl = 'presigned-url';

            // when
            messageAlreadyReceived.mockResolvedValueOnce(true);
            getSignedUrl.mockResolvedValue(presignedUrl);

            const response = await request(app)
                .get(`/fragments/${conversationId}/${messageId}`)
                .set('Authorization', authorizationKeys);

            // then
            expect(response.status).toBe(200);
            expect(getSignedUrl).toHaveBeenCalledWith(conversationId, messageId, 'getObject');
            expect(response.text).toEqual(presignedUrl);
            expect(logInfo).toHaveBeenCalledWith('Presigned URL sent successfully');
        });
    });

    describe('error', () => {
        // given
        const conversationId = uuid();
        const messageId = uuid();

        it('should return a 404 error when the record is not found', async () => {
            // given
            const presignedUrl = 'presigned-url';

            // when
            messageAlreadyReceived.mockResolvedValueOnce(false);

            const response = await request(app)
                .get(`/fragments/${conversationId}/${messageId}`)
                .set('Authorization', authorizationKeys);

            // then
            expect(response.status).toBe(404);
            expect(getSignedUrl).not.toHaveBeenCalled();
            expect(messageAlreadyReceived).toHaveBeenCalledWith(messageId);
        });


        it('should return a 503 when getSignedUrl promise is rejected', async () => {
            // given
            const error = new Error('error');

            // when
            messageAlreadyReceived.mockResolvedValueOnce(true);
            getSignedUrl.mockRejectedValueOnce(error);

            const response = await request(app)
                .get(`/fragments/${conversationId}/${messageId}`)
                .set('Authorization', authorizationKeys);

            // then
            expect(getSignedUrl).toHaveBeenCalledWith(conversationId, messageId, 'getObject');
            expect(logError).toHaveBeenCalledWith('Failed to retrieve pre-signed url', error);
            expect(response.status).toBe(503);
        });
    });

    describe('validation', () => {
        it('should return 422 and an error message when conversationId is not a UUID', async () => {
            // given
            const conversationId = 'not-a-uuid';
            const messageId = uuid();
            const expectedErrorMessage = [{ conversationId: "'conversationId' provided is not a UUID" }];

            // when
            const response = await request(app)
                .get(`/fragments/${conversationId}/${messageId}`)
                .set('Authorization', authorizationKeys);

            // then
            expect(response.status).toBe(422);
            expect(response.body).toEqual({
                errors: expectedErrorMessage,
            });
        });

        it('should return 422 and an error message when messageId is not a UUID', async () => {
            // given
            const conversationId = uuid();
            const messageId = 'not-a-uuid';
            const errorMessage = [{ messageId: "'messageId' provided is not a UUID" }];

            // when
            const response = await request(app)
                .get(`/fragments/${conversationId}/${messageId}`)
                .set('Authorization', authorizationKeys);

            // then
            expect(response.status).toBe(422);
            expect(response.body).toEqual({
                errors: errorMessage,
            });
        });
    })
})