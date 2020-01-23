'use strict';

const tableName = 'manifests_message_fragments';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(tableName, [
      {
        manifest_id: 'f0a906ef-49b6-49a8-89f1-cb063d31c4dc',
        message_fragment_id: '74c6230b-36d9-4940-bdd6-495ba87ed634',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        manifest_id: 'f0a906ef-49b6-49a8-89f1-cb063d31c4dc',
        message_fragment_id: 'a1ff815c-6452-4020-ab13-9200d27a06ed',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        manifest_id: 'd65c74cb-5b74-4185-8404-f5284fd5ce89',
        message_fragment_id: 'a1ff815c-6452-4020-ab13-9200d27a06ed',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete(tableName, null, {});
  }
};
