'use strict';

const tableName = 'message_fragments';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(tableName, [
      {
        id: '74c6230b-36d9-4940-bdd6-495ba87ed634',
        message_id: '8c0f741e-82fa-46f1-9686-23a1c08657f1',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'a1ff815c-6452-4020-ab13-9200d27a06ed',
        message_id: '5cff6bcf-98ea-4c60-8f65-4b0240324284',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'c47134d3-6ef7-4852-8e86-a5fd1a3c81ce',
        message_id: '6f1ad957-aa63-404c-80c5-97d8a73cb5ea',
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
