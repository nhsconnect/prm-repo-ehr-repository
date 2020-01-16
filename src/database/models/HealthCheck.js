import getParameters from './parameters';

const modelName = 'HealthCheck';
const tableName = 'health_checks';

const model = dataType => ({
  id: {
    type: dataType.UUID,
    primaryKey: true,
    defaultValue: dataType.UUIDV4
  },
  created_at: {
    type: dataType.DATE,
    allowNull: false
  },
  updated_at: {
    type: dataType.DATE,
    allowNull: false
  },
  deleted_at: dataType.DATE
});

module.exports = (sequelize, DataTypes) => {
  return sequelize.define(modelName, model(DataTypes), {
    ...getParameters(tableName)
  });
};
