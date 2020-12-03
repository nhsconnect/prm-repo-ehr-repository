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
      },
      {
        id: 'b8be9129-b2b6-48cd-b9b4-7576f0869057',
        conversation_id: '07ba6c7b-a794-48f6-80aa-91055bf15758',
        patient_id: 'd316b74f-5338-434d-9268-760781a04835',
        created_at: new Date(`2015-03-25T12:00:00Z`),
        updated_at: new Date(`2015-03-26T12:00:00Z`),
        completed_at: new Date(`2015-03-26T12:00:00Z`)
      },
      {
        id: 'e66716d2-3208-4ef6-88b5-6a77f16125f5',
        conversation_id: '6952c28c-b806-44f9-9b06-6bfe2e99dcba',
        patient_id: 'd316b74f-5338-434d-9268-760781a04835',
        created_at: new Date(`2018-03-25T12:00:00Z`),
        updated_at: new Date(`2018-03-26T12:00:00Z`),
        completed_at: new Date(`2018-03-26T12:00:00Z`)
      },
      {
        id: '2613d1bd-0ee1-40de-9702-3937318e7276',
        conversation_id: '1a528bd9-3861-4a8f-a64e-9a469f9f90e7',
        patient_id: 'd316b74f-5338-434d-9268-760781a04835',
        created_at: new Date(`2020-03-25T12:00:00Z`),
        updated_at: new Date(`2020-03-25T12:00:00Z`)
      }
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete(tableName, null, {});
  }
};
