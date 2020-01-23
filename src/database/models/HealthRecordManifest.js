import getParameters from './parameters';

const modelName = 'HealthRecordManifest';
const tableName = 'health_record_manifests';

const model = dataType => ({
  id: {
    type: dataType.UUID,
    primaryKey: true,
    defaultValue: dataType.UUIDV4
  },
  health_record_id: {
    type: dataType.UUID,
    references: {
      model: 'health_records', // 'persons' refers to table name
      key: 'id' // 'id' refers to column name in persons table
    }
  },
  message_id: {
    type: dataType.UUID,
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
  const HealthRecordManfiest = sequelize.define(
    modelName,
    model(DataTypes),
    getParameters(tableName)
  );

  HealthRecordManfiest.complete = options => {
    return HealthRecordManfiest.update(
      {
        completed_at: new Date()
      },
      options
    );
  };

  HealthRecordManfiest.associate = models => {
    HealthRecordManfiest.belongsTo(models.HealthRecord, { foreignKey: 'health_record_id' });
    HealthRecordManfiest.belongsToMany(models.MessageFragment, {
      through: 'manifests_message_fragments',
      foreignKey: 'manifest_id'
    });
  };

  return HealthRecordManfiest;
};
