"use strict";

const tableName = "health_record_manifests";

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.bulkInsert(tableName,
      [{
        slug: "f16ba9e9-1d28-42eb-acbb-f163ce0b632a",
        conversation_id: "0d04e711-bf8b-4891-ae94-21ff0ae9e7ed",
        created_at: new Date(),
        updated_at: new Date()
      },
        {
          slug: "953b1757-163d-48dd-997b-5dc79c8f60a9",
          conversation_id: "a50bd651-57a6-43a2-bd7a-ab970f4da011",
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          slug: "5592523d-0443-4fc6-a31b-b8e712fd262c",
          conversation_id: "49f79adf-99d4-4e77-9744-6162512afb91",
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
