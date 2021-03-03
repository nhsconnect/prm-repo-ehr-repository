import { initializeConfig } from '../src/config';

const axios = require('axios');
const config = initializeConfig();

axios
  .get(config.ehrRepoServiceUrl + '/health')
  .then(response => {
    console.log(response);
    if (response.status !== 200) {
      process.exit(5);
    }
  })
  .catch(err => {
    console.log(err);
    process.exit(8);
  });
