import request from 'supertest'
import app from './app'
import getSignedUrl from './services/get-signed-url'

jest.mock('./services/get-signed-url', () => jest.fn().mockReturnValue(Promise.resolve()));

describe('POST /url', () => {
    it('should return 202', done => {
        request(app)
            .post('/url')
            .send({registrationId: 'registration-id', conversationId: 'conversation-id'})
            .expect(202)
            .end(done);
    });

    it('should call getSignedUrl service with request body', done => {
        request(app)
            .post('/url')
            .send({registrationId: 'registration-id', conversationId: 'conversation-id'})
            .expect(() => {
                expect(getSignedUrl).toHaveBeenCalledWith('registration-id', 'conversation-id')
            })
            .end(done);
    });

    it('should return 400 if the request body is empty', done => {
            request(app)
                .post('/url')
                .send()
                .expect(400)
                .end(done);
    });

});
