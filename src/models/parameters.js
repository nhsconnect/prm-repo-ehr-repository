/**
 * @deprecated
 * Postgres DB related stubs
 * To be deleted PRMT-4568
 */
const getParameters = (tableName) => ({
  tableName: tableName,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  timestamps: true,
  schema: 'public',
  paranoid: true,
});

export const getParametersRefactored = (tableName) => ({
  tableName: tableName,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  timestamps: true,
  schema: 'public',
  paranoid: true,
});

export default getParameters;
