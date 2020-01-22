import getParameters from './parameters';
const modelName = 'HealthRecord';
const tableName = 'health_records';

const model = dataType => ({
  id: {
    type: dataType.UUID,
    primaryKey: true,
    defaultValue: dataType.UUIDV4
  },
  patient_id: {
    type: dataType.UUID,
    references: {
      model: 'patients', // 'persons' refers to table name
      key: 'id' // 'id' refers to column name in persons table
    }
  },
  conversation_id: {
    type: dataType.STRING(100),
    unique: true,
    allowNull: false
  },
  completed_at: dataType.DATE,
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
  const HealthRecord = sequelize.define(modelName, model(DataTypes), getParameters(tableName));

  HealthRecord.complete = options => {
    return HealthRecord.update(
      {
        completed_at: new Date()
      },
      options
    );
  };

  HealthRecord.associate = models => {
    HealthRecord.belongsTo(models.Patient, { foreignKey: 'patient_id' });
    HealthRecord.hasMany(models.MessageFragment, { foreignKey: 'health_record_id' });
  };

  return HealthRecord;
};
