import moment from 'moment-timezone';

export const getNow = () => new Date();

export const getUKTimestamp = () => {
  return moment().tz('Europe/London').format('YYYY-MM-DDThh:mm:ssZ');
};


export const getEpochTimeInSecond = () => {
  return moment().unix();
}