"use strict";

const uuid = require("uuid/v4");
const tableName = "Patients";

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.bulkInsert(tableName,
      [{
        slug: uuid(),
        nhs_number: 111111,
        created_at: new Date(),
        updated_at: new Date()
      },
        {
          slug: uuid(),
          nhs_number: 222222,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          slug: uuid(),
          nhs_number: 333333,
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: new Date()
        }
      ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete(tableName, null, {});
  }
};
