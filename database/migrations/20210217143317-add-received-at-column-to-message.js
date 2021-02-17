module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'messages',
      'received_at',
      {
        type: Sequelize.DATE
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'messages',
      'received_at');
  }
};