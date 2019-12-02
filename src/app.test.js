import request from 'supertest'
import app from './app'
import upload from './services/upload'

jest.mock('./services/upload', () => jest.fn().mockReturnValue(Promise.resolve()));

describe('POST /url', () => {
    it('should return 201', done => {
        request(app)
            .post('/url')
            .send({nhsNumber: 'nhs-number', ehr: 'some-data'})
            .expect(201)
            .end(done);
    });

    it('should call upload service with request body', done => {
        request(app)
            .post('/url')
            .send({nhsNumber: 'nhs-number', ehr: 'some-data'})
            .expect(() => {
                expect(upload).toHaveBeenCalledWith('some-data', 'nhs-number')
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
