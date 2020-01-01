import getHealthCheck from './get-health-check';
import { Client } from 'pg';
import { S3 } from 'aws-sdk';
//import { updateLogEvent } from '../middleware/logging';

jest.mock('uuid/v4', () => jest.fn().mockReturnValue('some-uuid'));
jest.mock('aws-sdk');
jest.mock('pg');

const s3MockPutObjectGood = jest.fn().mockImplementation((config, callback) => callback());
const s3MockPutObjectBad = jest
  .fn()
  .mockImplementation((config, callback) => callback('some s3 error'));

const dbMockConnectGood = jest.fn().mockImplementation(() => Promise.resolve());
const dbMockConnectBad = jest.fn().mockImplementation(() => Promise.reject('db connection failed'));
const dbMockQueryGood = jest.fn().mockImplementation(() => Promise.resolve());
const dbMockQueryBad = jest.fn().mockImplementation(() => Promise.reject('db query failed'));
const dbMockEnd = jest.fn().mockImplementation(() => Promise.resolve());

beforeEach(() => {
  Client.mockClear();
  S3.mockClear();
});
describe('getHealthCheck', () => {
  describe('local environment', () => {
    process.env.NODE_ENV = 'local';
  });

  describe('prod environment', () => {
    process.env.NODE_ENV = 'prod';

    it('should get reject with error from s3 if run in production mode and s3 returns an error', () => {
      S3.mockImplementation(() => ({
        putObject: s3MockPutObjectBad
      }));

      Client.mockImplementation(() => ({
        connect: dbMockConnectGood,
        query: dbMockQueryGood,
        end: dbMockEnd
      }));
      return getHealthCheck().then(result => {
        const s3 = result[0];
        expect(s3).toEqual({
          type: 's3',
          bucketName: undefined,
          available: true,
          writable: false,
          error: 'some s3 error'
        });
      });
    });

    it('should return true of the db connection if db connection is healthy', () => {
      S3.mockImplementation(() => ({
        putObject: s3MockPutObjectGood
      }));

      Client.mockImplementation(() => ({
        connect: dbMockConnectGood,
        query: dbMockQueryBad,
        end: dbMockEnd
      }));

      return getHealthCheck().then(result => {
        const db = result[1];
        expect(db).toEqual({
          type: 'postgresql',
          connection: true,
          writable: false,
          error: 'db query failed'
        });
      });
    });

    it('should return true of the db connection if db connection is healthy', () => {
      S3.mockImplementation(() => ({
        putObject: s3MockPutObjectGood
      }));

      Client.mockImplementation(() => ({
        connect: dbMockConnectBad,
        query: dbMockQueryGood,
        end: dbMockEnd
      }));

      return getHealthCheck().then(result => {
        const db = result[1];
        expect(db).toEqual({
          type: 'postgresql',
          connection: false,
          writable: false,
          error: 'db connection failed'
        });
      });
    });
  });
});
