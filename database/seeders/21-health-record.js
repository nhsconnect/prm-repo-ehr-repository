'use strict';

const tableName = 'health_records';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(tableName, [
      {
        id: '04523969-6679-4ac8-8222-c226ff7a155f',
        patient_id: '3779fb0c-4142-43a4-a9b8-c5f5f3f632cc',
        conversation_id: '7702ba64-1b9e-49f4-948e-bc26ff598355',
        created_at: new Date(),
        updated_at: new Date(),
        completed_at: new Date()
      },
      {
        id: '7a1515b9-4d2d-415c-b4e2-09392af8fec4',
        patient_id: '3779fb0c-4142-43a4-a9b8-c5f5f3f632cc',
        conversation_id: '8de97bb4-d7dc-4e1a-b621-4f5957c8f0f2',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'cb3d2ad3-3cdb-45fa-94bd-0e5779166c8b',
        patient_id: '3779fb0c-4142-43a4-a9b8-c5f5f3f632cc',
        conversation_id: 'f95eabf7-4d26-4195-9118-b425523b5eeb',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'a717d32e-fe34-42c5-a564-9d6b3049b624',
        patient_id: '3779fb0c-4142-43a4-a9b8-c5f5f3f632cc',
        conversation_id: 'e6e6daa9-a15d-4d0f-9f7b-a71be71949e8',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'deeb8288-df5f-4197-a5b9-743992f4d10f',
        patient_id: '3779fb0c-4142-43a4-a9b8-c5f5f3f632cc',
        conversation_id: '741e652e-5a7a-4eca-9807-de9b9554ff39',
        created_at: new Date(),
        updated_at: new Date(),
        completed_at: new Date()
      },
      {
        id: '5dc9d99c-c018-46d3-bba2-49bc4489e529',
        patient_id: '3779fb0c-4142-43a4-a9b8-c5f5f3f632cc',
        conversation_id: 'e6e6daa9-a15d-4d0f-9f7b-a71bf71949e8',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '08850511-50c8-436e-b12c-5c452758c4ec',
        patient_id: '3779fb0c-4142-43a4-a9b8-c5f5f3f632cc',
        conversation_id: '16759b26-cc82-4cc3-b14a-317eeb7d0446',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '4aa3f0fa-197d-4af3-b64f-4a125cbefeb0',
        patient_id: '3779fb0c-4142-43a4-a9b8-c5f5f3f632cc',
        conversation_id: '4fb34d82-52b4-4bbf-b665-bd23c4d0de2f',
        created_at: new Date(),
        updated_at: new Date(),
        completed_at: new Date()
      }
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete(tableName, null, {});
  }
};
