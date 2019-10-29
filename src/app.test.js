import request from 'supertest'
import app from './app'
import upload from './services/upload'

jest.mock('./services/upload', () => {
    return jest.fn().mockReturnValue(Promise.resolve())
});

describe('POST /ehr', () => {
    it('should return 201', done => {
        request(app)
            .post('/ehr')
            .expect(201)
            .end(done);
    });

    it('should call upload service with request body', done => {
        request(app)
            .post('/ehr')
            .send({data: 'some-data'})
            .expect(() => {
                expect(upload).toHaveBeenCalledWith('some-data')
            })
            .end(done);
    });
});
