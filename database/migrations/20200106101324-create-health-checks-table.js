"use strict";

const tableName = "health_checks";

const model = (dataType) => {
  return {
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
    deleted_at: dataType.DATE,
    completed_at: {
      type: dataType.DATE,
      allowNull: false
    },
    created_at: {
      type: dataType.DATE,
      allowNull: false
    },
    updated_at: {
      type: dataType.DATE,
      allowNull: false
    }
  };
};
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(tableName, model(Sequelize));
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable(tableName);
  }
};