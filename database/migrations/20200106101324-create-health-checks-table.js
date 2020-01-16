'use strict';

const tableName = 'health_checks';

const model = dataType => {
  return {
    id: {
      type: dataType.UUID,
      primaryKey: true
    },
    created_at: {
      type: dataType.DATE,
      allowNull: false
    },
    updated_at: {
      type: dataType.DATE,
      allowNull: false
    },
    deleted_at: dataType.DATE
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
