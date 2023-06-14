export const generateRandomNhsNumber = () => parseInt(Math.random().toString().slice(2, 12));

export const generateMultipleRandomNhsNumbers = (amount) =>
  Array(amount)
    .fill(undefined)
    .map(() => parseInt(Math.random().toString().slice(2, 12)));
