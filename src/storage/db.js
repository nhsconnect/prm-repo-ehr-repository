import { Client } from 'pg';
import config from '../config';

const client = new Client({
  user: config.databaseUser,
  password: config.databasePassword,
  database: config.databaseName,
  host: config.databaseHost
});
client.connect();

const save = (nhsNumber, storageLocation) => {
    return client
      .query('INSERT INTO ehr(nhs_number, s3_key) VALUES ($1, $2)', [nhsNumber, storageLocation])
      .finally(() => client.end());
};

const saveHealthCheck = (formattedDate) => {
  return new Promise((resolve, reject)=>{

    client.query('INSERT INTO health(completed_at) VALUES ($1)', [formattedDate], (err, res) => {
      if(err){
        reject(err);
      }
      //console.log(err ? err.stack : res.rows[0].completed_at);
      resolve(res);
    });
  }).then(()=>{
    client.end();
  });
};

export {save, saveHealthCheck}