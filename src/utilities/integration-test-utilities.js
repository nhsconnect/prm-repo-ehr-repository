import { v4 as uuidv4 } from 'uuid';

export const generateRandomNhsNumber = () => (Math.floor(Math.random() * 9e9) + 1e9).toString();

export const generateRandomUUID = (isUppercase) =>
  isUppercase ? uuidv4().toUpperCase() : uuidv4();

export const generateMultipleUUID = (amount, isUppercase) =>
  Array(amount)
    .fill(undefined)
    .map(() => (isUppercase ? uuidv4().toUpperCase() : uuidv4()));
