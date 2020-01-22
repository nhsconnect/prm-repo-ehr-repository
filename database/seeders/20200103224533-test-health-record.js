'use strict';

const tableName = 'health_records';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(tableName, [
      {
        id: '7d5712f2-d203-4f11-8527-1175db0d2a4a',
        conversation_id: '8ab7f61f-0e6b-4378-8cac-dcb4f9e3ec54',
        patient_id: 'e479ca12-4a7d-41cb-86a2-775f36b8a0d1',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '99ba0ba1-ed1a-4fc1-ab5b-9d79af71aef4',
        conversation_id: '3244a7bb-555e-433b-b2cc-1aa8178da99e',
        patient_id: 'd126ee7f-035e-4938-8996-09a28c2ba61c',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '1879b920-7174-4ef1-92f7-12383114b052',
        conversation_id: '10489310-e97b-4744-8f3d-b7af1c47596d',
        patient_id: 'd126ee7f-035e-4938-8996-09a28c2ba61c',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '0879b920-7174-4ef1-92f7-12383114b052',
        conversation_id: '30489310-e97b-4744-8f3d-b7af1c47596d',
        patient_id: 'd126ee7f-035e-4938-8996-09a28c2ba61c',
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
