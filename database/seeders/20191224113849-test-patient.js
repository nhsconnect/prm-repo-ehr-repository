"use strict";

const tableName = "patients";

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.bulkInsert(tableName,
      [{
        slug: "e479ca12-4a7d-41cb-86a2-775f36b8a0d1",
        nhs_number: 111111,
        created_at: new Date(),
        updated_at: new Date()
      },
        {
          slug: "d126ee7f-035e-4938-8996-09a28c2ba61c",
          nhs_number: 222222,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          slug: "944513e3-9f12-4284-b23c-8c319dbd3599",
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
