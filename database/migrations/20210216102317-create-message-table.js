'use strict';

const MessageType = {
  EHR_EXTRACT: 'ehrExtract',
  ATTACHMENT: 'attachment'
};

const tableName = 'messages';

const model = dataType => {
  return {
    messageId: {
      field: 'message_id',
      type: dataType.UUID,
      primaryKey: true,
      defaultValue: dataType.UUIDV4
    },
    conversationId: {
      field: 'conversation_id',
      type: dataType.UUID,
      allowNull: false
    },
    parentId: {
      field: 'parent_id',
      type: dataType.UUID
    },
    type: {
      field: 'type',
      type: dataType.STRING,
      isIn: [Object.values(MessageType)],
      allowNull: false
    },
    createdAt: {
      field: 'created_at',
      type: dataType.DATE,
      allowNull: false
    },
    updatedAt: {
      field: 'updated_at',
      type: dataType.DATE,
      allowNull: false
    },
    deletedAt: {
      field: 'deleted_at',
      type: dataType.DATE
    }
  }
};

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(tableName, model(Sequelize));
  },
  down: queryInterface => {
    return queryInterface.dropTable(tableName);
  }
};
