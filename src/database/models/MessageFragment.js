import getParameters from './parameters';

const modelName = 'MessageFragment';
const tableName = 'message_fragments';

const model = dataType => ({
  id: {
    type: dataType.UUID,
    primaryKey: true
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
  const MessageFragment = sequelize.define(modelName, model(DataTypes), getParameters(tableName));

  MessageFragment.complete = options => {
    return MessageFragment.update(
      {
        completed_at: new Date()
      },
      options
    );
  };

  return MessageFragment;
};
