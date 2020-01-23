'use strict';

const tableName = 'manifests_message_fragments';

const model = dataType => ({
  id: {
    type: dataType.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  manifest_id: {
    type: dataType.UUID,
    references: {
      model: 'health_record_manifests',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    allowNull: false
  },
  message_fragment_id: {
    type: dataType.UUID,
    references: {
      model: 'message_fragments',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    allowNull: false
  },
  deleted_at: {
    type: dataType.DATE,
  },
  created_at: {
    type: dataType.DATE,
    allowNull: false
  },
  updated_at: {
    type: dataType.DATE,
    allowNull: false
  }
});

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(tableName, model(Sequelize));
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable(tableName);
  }
};
