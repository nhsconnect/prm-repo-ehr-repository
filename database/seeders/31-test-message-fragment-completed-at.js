'use strict';

const tableName = 'message_fragments';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(tableName, [
      {
        id: '1856e953-b336-4385-81c6-fc6d7bc6b846',
        message_id: '4b677d19-f13f-488a-84ac-57f6948b34fe',
        health_record_id: '7d5712f2-d203-4f11-8527-1175db0d2a4a',
        completed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '4dd0193f-6ab9-47f5-8cce-e5506d466702',
        message_id: 'b829bc94-58d5-4481-99e1-8cc1afacae06',
        health_record_id: '7d5712f2-d203-4f11-8527-1175db0d2a4a',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '38e25280-e69b-4a46-a173-b9a9024fe44e',
        message_id: '0d4ab563-255d-4130-be27-297ea846f39d',
        health_record_id: '7a1515b9-4d2d-415c-b4e2-09392af8fec4',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '572c0b80-df78-4975-9a2b-f5ccc7cc495b',
        message_id: '5a5fd36a-47fc-4e85-81d2-d05c05666667',
        health_record_id: 'b8be9129-b2b6-48cd-b9b4-7576f0869057',
        created_at: new Date(`2015-03-25T12:00:00Z`),
        updated_at: new Date(`2015-03-26T12:00:00Z`),
        completed_at: new Date(`2015-03-26T12:00:00Z`)
      },
      {
        id: '911804e8-2b23-48f9-9261-ee6df2f14e64',
        message_id: '5bcf9bc1-190a-4c1c-814d-0fa6ef3ecce6',
        health_record_id: 'e66716d2-3208-4ef6-88b5-6a77f16125f5',
        created_at: new Date(`2018-03-25T12:00:00Z`),
        updated_at: new Date(`2018-03-26T12:00:00Z`),
        completed_at: new Date(`2018-03-26T12:00:00Z`)
      }
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete(tableName, null, {});
  }
};
