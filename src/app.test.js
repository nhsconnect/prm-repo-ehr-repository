import request from 'supertest'
import app from './app'
import getSignedUrl from './services/get-signed-url'
import getUrl from "./storage/s3";
import config from "./config";
import {S3} from "aws-sdk";

jest.mock('./services/get-signed-url', () => jest.fn().mockReturnValue(Promise.resolve('some-url')));

describe('POST /url', () => {
    it('should return 202', done => {
        request(app)
            .post('/url')
            .send({conversationId: 'conversation-id'})
            .expect(202)
            .end(done);
    });

    it('should call getSignedUrl service with request body', done => {
        request(app)
            .post('/url')
            .send({conversationId: 'conversation-id'})
            .expect(() => {
                expect(getSignedUrl).toHaveBeenCalledWith('conversation-id');
            }).end(done);
    });

    it('should return url from s3 when the endpoint being called', done=>{
      request(app)
        .post('/url')
        .send({conversationId: 'conversation-id'})
        .expect(() => {
          getSignedUrl('conversation-id')
            .then(url=>{
              expect(url).toBe('some-url');
              done();
            })
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
