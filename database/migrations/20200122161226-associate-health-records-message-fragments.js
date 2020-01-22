module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.addColumn(
      'message_fragments',
      'health_record_id',
      {
        type: Sequelize.UUID,
        references: {
          model: 'health_records',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'message_fragments',
      'health_record_id'
    );
  }
};