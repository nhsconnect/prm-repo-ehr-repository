import { initializeConfig } from '../src/config';

const axios = require('axios');
const config = initializeConfig();

axios
  .patch(config.ehrRepoServiceUrl + '/health-record/1234/message/4321', { transferComplete: true })
  .then(response => {
    console.log(response);
    if (response.status !== 204) {
      process.exit(5);
    }
  })
  .catch(err => {
    console.log(err);
    process.exit(8);
  });
