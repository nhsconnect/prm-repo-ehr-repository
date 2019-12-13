import { Client } from 'pg';
import config from '../config';
import { save, saveHealthCheck } from './db';

describe('db', () => {
  const client = new Client({
    user: config.databaseUser,
    password: config.databasePassword,
    database: config.databaseName,
    host: config.databaseHost
  });

  beforeAll(() => client.connect());
  afterAll(() => client.end());

  describe('save', () => {
    afterEach(() => client.query('DELETE FROM ehr'));
    it('should save the nhs number and storage location to the db', () => {

      return save('some-nhs-number', 'some-storage-location')
        .then(() => client.query('SELECT * FROM ehr'))
        .then(res => {
          expect(res.rowCount).toEqual(1);

          const ehr = res.rows[0];
          expect(ehr.nhs_number).toEqual('some-nhs-number');
          expect(ehr.s3_key).toEqual('some-storage-location');
        })
    });
  });

  describe('saveHealthCheck', () => {
    afterEach(() => client.query('DELETE FROM health'));

    it('should save the timestamp to the db in health table', done => {

      return saveHealthCheck('some-timestamp')
        .then(() => client.query('SELECT * FROM health'))
        .then(res => {
          expect(res.rowCount).toEqual(1);

          const health = res.rows[0];
          expect(health.completed_at).toEqual('some-timestamp');
          done();
        })
    });
});
