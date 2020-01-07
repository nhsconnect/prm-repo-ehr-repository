"use strict";

const tableName = "health_records";

module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.bulkInsert(tableName,
      [{
        slug: "7d5712f2-d203-4f11-8527-1175db0d2a4a",
        patient_id: 1,
        conversation_id: "8ab7f61f-0e6b-4378-8cac-dcb4f9e3ec54",
        created_at: new Date(),
        updated_at: new Date()
      },
        {
          slug: "99ba0ba1-ed1a-4fc1-ab5b-9d79af71aef4",
          patient_id: 2,
          conversation_id: "3244a7bb-555e-433b-b2cc-1aa8178da99e",
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          slug: "0879b920-7174-4ef1-92f7-12383114b052",
          patient_id: 3,
          conversation_id: "30489310-e97b-4744-8f3d-b7af1c47596d",
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
