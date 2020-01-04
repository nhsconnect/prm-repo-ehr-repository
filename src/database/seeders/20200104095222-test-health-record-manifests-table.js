"use strict";

const uuid = require("uuid/v4");
const tableName = "health_record_manifests";

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.bulkInsert(tableName,
      [{
        slug: uuid(),
        conversation_id: uuid(),
        created_at: new Date(),
        updated_at: new Date()
      },
        {
          slug: uuid(),
          conversation_id: uuid(),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          slug: uuid(),
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
