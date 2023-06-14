import { v4 as uuidv4 } from 'uuid';

export const generateRandomNhsNumber = () =>
  Math.random().toString().slice(2, 12).replace('0', '5');

export const generateMultipleRandomNhsNumbers = (amount) =>
  Array(amount)
    .fill(undefined)
    .map(() => Math.random().toString().slice(2, 12).replace('0', '5'));

export const generateRandomUUID = (isUppercase) =>
  isUppercase ? uuidv4().toUpperCase() : uuidv4();

export const generateMultipleUUID = (amount, isUppercase) =>
  Array(amount)
    .fill(undefined)
    .map(() => (isUppercase ? uuidv4().toUpperCase() : uuidv4()));
