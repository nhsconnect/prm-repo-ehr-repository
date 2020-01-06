import getParameters from './parameters';

const modelName = 'HealthCheck';
const tableName = 'health_checks';

const model = dataType => ({
  id: {
    type: dataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  slug: {
    type: dataType.UUID,
    unique: true,
    allowNull: false
  },
  completed_at: {
    defaultValue: new Date(),
    type: dataType.DATE,
    allowNull: false
  },
  deleted_at: dataType.DATE,
  created_at: {
    type: dataType.DATE,
    allowNull: false
  },
  updated_at: {
    type: dataType.DATE,
    allowNull: false
  }
});

module.exports = (sequelize, DataTypes) => {

  return sequelize.define(modelName, model(DataTypes), {
    ...getParameters(tableName)
  });
};
