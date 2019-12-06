import {Client} from 'pg';
import config from "../config";

export const save = (nhsNumber, storageLocation) => {
    const client = new Client({
        user: config.databaseUser,
        password: config.databasePassword,
        database: config.databaseName,
        host: config.databaseHost
    });
    client.connect();

    return client.query('INSERT INTO ehr(nhs_number, s3_key) VALUES ($1, $2)', [nhsNumber, storageLocation])
        .finally(() => client.end())
};
