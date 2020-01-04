'use strict';

const tableName = "health_records";

const model = (dataType) => ({
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
  patient_id: {
    type: dataType.INTEGER,
    allowNull: false
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

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(tableName, model(Sequelize));
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable(tableName);
  }
};