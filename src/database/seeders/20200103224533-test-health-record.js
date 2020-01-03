"use strict";

const uuid = require("uuid/v4");
const tableName = "HealthRecords";

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.bulkInsert(tableName,
      [{
        slug: uuid(),
        patient_id: 1,
        conversation_id: uuid(),
        created_at: new Date(),
        updated_at: new Date()
      },
        {
          slug: uuid(),
          patient_id: 2,
          conversation_id: uuid(),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          slug: uuid(),
          patient_id: 3,
          conversation_id: uuid(),
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
