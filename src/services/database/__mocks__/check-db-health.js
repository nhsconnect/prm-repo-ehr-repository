export const checkDbHealth = () => ({
  type: 'postgresql',
  connection: true,
  writable: true,
});
