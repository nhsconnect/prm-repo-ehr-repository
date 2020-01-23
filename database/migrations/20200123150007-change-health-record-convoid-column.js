module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'health_records',
      'conversation_id')
      .then(() => queryInterface.addColumn(
        'health_records',
        'conversation_id',
        {
          type: Sequelize.UUID,
          unique: true,
          allowNull: false
        })
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'health_records',
      'conversation_id')
      .then(() => queryInterface.addColumn(
        'health_records',
        'conversation_id',
        {
          type: Sequelize.STRING(100),
          unique: true,
          allowNull: false
        })
      );
  }
};