import { getParametersRefactored } from './parameters';

export const modelName = 'HealthRecord';
const tableName = 'health_records';

const model = (dataType) => ({
  conversationId: {
    field: 'conversation_id',
    type: dataType.UUID,
    primaryKey: true,
    defaultValue: dataType.UUIDV4,
  },
  nhsNumber: {
    field: 'nhs_number',
    type: dataType.CHAR(10),
    validate: {
      isNumeric: true,
      len: 10,
    },
    allowNull: false,
  },
  completedAt: {
    field: 'completed_at',
    type: dataType.DATE,
  },
  createdAt: {
    field: 'created_at',
    type: dataType.DATE,
    allowNull: false,
  },
  updatedAt: {
    field: 'updated_at',
    type: dataType.DATE,
    allowNull: false,
  },
  deletedAt: {
    field: 'deleted_at',
    type: dataType.DATE,
  },
});

export default (sequelize, DataTypes) => {
  return sequelize.define(modelName, model(DataTypes), getParametersRefactored(tableName));
};
