import getHealthCheck from './get-health-check';
import { Client } from 'pg';
import { S3 } from 'aws-sdk';

jest.mock('uuid/v4', () => jest.fn().mockReturnValue('some-uuid'));
jest.mock('aws-sdk');
jest.mock('pg');

describe('getHealthCheck', () => {
  const mockPutObject = jest.fn().mockImplementation((config, callback) => callback(null));
  S3.mockImplementation(() => ({
    putObject: mockPutObject
  }));

  it('should get reject with error from s3 if run in production mode and s3 returns an error', () => {
    process.env.NODE_ENV = 'prod';

    mockPutObject.mockImplementation((config, callback) => callback('some-error'));

    return expect(getHealthCheck()).rejects.toBe('some-error');
  });

  it('should reject the promise if run in production mode and db returns an error', () => {
    const mockQuery = jest
      .fn()
      .mockImplementation((config, callback) => callback('some-error', 'some-respond'));
    Client.mockImplementation(() => {
      mockQuery;
    });

    return expect(getHealthCheck()).rejects.toBe('some-error');
  });
});
