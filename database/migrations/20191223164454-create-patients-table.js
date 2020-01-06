'use strict';

const tableName = "patients";

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
    nhs_number: {
      type: dataType.STRING(100),
      unique: true,
      allowNull: false
    },
    deleted_at: {
      type: dataType.DATE
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