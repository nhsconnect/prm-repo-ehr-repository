import ModelFactory from '../src/models';

const INTERVAL = 1000;
let ATTEMPTS = 10;

const connect = () => {
  ModelFactory.sequelize
    .authenticate()
    .then(() => {
      console.log('Successfully connected');
    })
    .catch(() => {
      if (ATTEMPTS === 0) {
        throw new Error('Maximum number of attempts have been reached, exiting.');
      }
      console.log(`Attempt ${ATTEMPTS} to connect failed`);
      ATTEMPTS--;
      setTimeout(connect, INTERVAL);
    });
};

connect();
