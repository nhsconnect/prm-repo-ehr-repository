'use strict';

const tableName = 'health_record_manifests';

const model = dataType => ({
  id: {
    type: dataType.UUID,
    primaryKey: true
  },
  health_record_id: {
    type: dataType.UUID,
    references: {
      model: 'health_records',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
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

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(tableName, model(Sequelize));
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable(tableName);
  }
};
