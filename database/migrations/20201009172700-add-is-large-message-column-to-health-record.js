module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
        'health_records',
        'is_large_message',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false
        });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'health_records',
      'is_large_message');
  }
};