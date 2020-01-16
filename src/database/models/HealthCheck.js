import getParameters from './parameters';
import uuid from 'uuid/v4';

const modelName = 'HealthCheck';
const tableName = 'health_checks';

const model = dataType => ({
  id: {
    type: dataType.UUID,
    primaryKey: true,
    defaultValue: uuid()
  },
  completed_at: {
    defaultValue: new Date(),
    type: dataType.DATE,
    allowNull: false
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
