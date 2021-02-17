import { getParametersRefactored } from './parameters';

export const modelName = 'Message';
const tableName = 'messages';

export const MessageType = {
  EHR_EXTRACT: 'ehrExtract',
  ATTACHMENT: 'attachment'
};

Object.freeze(MessageType);

const model = dataType => ({
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
    validate: {
      isIn: [Object.values(MessageType)]
    },
    allowNull: false
  },
  receivedAt: {
    field: 'received_at',
    type: dataType.DATE
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
});

export default (sequelize, DataTypes) => {
  return sequelize.define(modelName, model(DataTypes), getParametersRefactored(tableName));
};
