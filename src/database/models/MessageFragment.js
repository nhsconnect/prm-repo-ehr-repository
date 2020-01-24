import getParameters from './parameters';

const modelName = 'MessageFragment';
const tableName = 'message_fragments';

const model = dataType => ({
  id: {
    type: dataType.UUID,
    primaryKey: true,
    defaultValue: dataType.UUIDV4
  },
  health_record_id: {
    type: dataType.UUID,
    references: {
      model: 'health_records',
      key: 'id'
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
  const MessageFragment = sequelize.define(modelName, model(DataTypes), getParameters(tableName));

  MessageFragment.complete = options => {
    return MessageFragment.update(
      {
        completed_at: new Date()
      },
      options
    );
  };

  MessageFragment.associate = models => {
    MessageFragment.belongsTo(models.HealthRecord, { foreignKey: 'health_record_id' });
    MessageFragment.belongsToMany(models.HealthRecordManifest, {
      through: 'manifests_message_fragments',
      foreignKey: 'message_fragment_id'
    });
  };

  MessageFragment.findOrCreateOne = (messageId, transaction) =>
    MessageFragment.findOrCreate({
      where: {
        message_id: messageId
      },
      transaction: transaction
    }).then(fragments => fragments[0]);

  MessageFragment.prototype.withHealthRecord = function(conversationId, transaction) {
    return sequelize.models.HealthRecord.findOrCreateOne(
      conversationId,
      transaction
    ).then(healthRecord => this.setHealthRecord(healthRecord.get().id));
  };

  return MessageFragment;
};
