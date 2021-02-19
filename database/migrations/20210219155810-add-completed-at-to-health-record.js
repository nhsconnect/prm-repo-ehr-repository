module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('health_records_new', 'completed_at', {
      type: Sequelize.DATE
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('health_records_new', 'completed_at');
  }
};
