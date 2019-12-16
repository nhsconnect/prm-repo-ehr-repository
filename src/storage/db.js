import { Client } from 'pg';
import config from '../config';
import { updateLogEventWithError, updateLogEvent } from '../middleware/logging';

const params = {
  user: config.databaseUser,
  password: config.databasePassword,
  database: config.databaseName,
  host: config.databaseHost
};

const save = (nhsNumber, storageLocation) => {
  updateLogEvent({ status: 'start saving ehr into database...' });
  const client = new Client(params);
  client.connect();
  return client
    .query('INSERT INTO ehr(nhs_number, s3_key) VALUES ($1, $2)', [nhsNumber, storageLocation])
    .then(() => updateLogEvent({ status: 'saved ehr to db sucessfully' }))
    .catch(err => {
      updateLogEventWithError(err);
      throw err;
    })
    .finally(() => client.end());
};

const saveHealthCheck = formattedDate => {
  updateLogEvent({ status: 'start database health check...' });
  const client = new Client(params);
  client.connect();
  return new Promise((resolve, reject) => {
    client.query('INSERT INTO health(completed_at) VALUES ($1)', [formattedDate], (err, res) => {
      if (err) {
        updateLogEventWithError(err);
        return reject(err);
      }
      updateLogEvent({ status: 'saved timestamp into database', table: 'health' });
      resolve(res);
    });
    //.finally(() => client.end());
  }).then(() => client.end());
};

export { save, saveHealthCheck };
