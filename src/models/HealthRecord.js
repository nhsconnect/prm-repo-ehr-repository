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
      model: 'patients', // 'patients' refers to table name
      key: 'id' // 'id' refers to column name in patients table
    }
  },
  conversation_id: {
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
  },
  is_large_message: {
    type: dataType.BOOLEAN,
    defaultValue: true
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
    HealthRecord.hasMany(models.HealthRecordManifest, { foreignKey: 'health_record_id' });
  };

  HealthRecord.findByConversationId = (conversationId, transaction) =>
    HealthRecord.findOne({
      where: {
        conversation_id: conversationId
      },
      transaction: transaction
    });

  HealthRecord.findOrCreateOne = (conversationId, isLargeMessage, transaction) =>
    HealthRecord.findOrCreate({
      where: {
        conversation_id: conversationId,
        is_large_message: isLargeMessage
      },
      transaction: transaction
    }).then(healthRecords => healthRecords[0]);

  HealthRecord.prototype.withPatient = function(nhsNumber, transaction) {
    return sequelize.models.Patient.findOrCreateOne(nhsNumber, transaction).then(patient => {
      return this.setPatient(patient.get().id, { transaction: transaction });
    });
  };

  HealthRecord.prototype.hasManifest = function(messageId, transaction) {
    return sequelize.models.HealthRecordManifest.findOrCreateOne(messageId, transaction)
      .then(manifest =>
        this.addHealthRecordManifests([manifest.get().id], { transaction: transaction })
      )
      .then(() => this);
  };

  return HealthRecord;
};
