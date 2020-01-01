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
  let resultObject = {
    type: 'postgresql',
    connection: false,
    writable: false
  };
  updateLogEvent({ status: 'start database health check...' });
  const client = new Client(params);

  return client
    .connect()
    .then(() => {
      resultObject.connection = true;
      return client
        .query('INSERT INTO health(completed_at) VALUES ($1)', [formattedDate])
        .then(() => updateLogEvent({ status: 'saved timestamp into database', table: 'health' }))
        .then(() => {
          resultObject.writable = true;
          return resultObject;
        })
        .catch(err => {
          updateLogEventWithError(err);
          resultObject.error = err;
          return resultObject;
        })
        .finally(() => {
          client.end();
        });
    })
    .catch(err => {
      updateLogEventWithError(err);
      resultObject.error = err;
      return resultObject;
    });
};
export { save, saveHealthCheck };
