'use strict';

const tableName = 'patients';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(tableName, [
      {
        id: 'e479ca12-4a7d-41cb-86a2-775f36b8a0d1',
        nhs_number: 1111111111,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'd126ee7f-035e-4938-8996-09a28c2ba61c',
        nhs_number: 2222222222,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '944513e3-9f12-4284-b23c-8c319dbd3599',
        nhs_number: 3333333333,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: new Date()
      },
      {
        id: 'd316b74f-5338-434d-9268-760781a04835',
        nhs_number: 5555555555,
        created_at: new Date(`2015-03-25T12:00:00Z`),
        updated_at: new Date(`2015-03-26T12:00:00Z`)
      }
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete(tableName, null, {});
  }
};
