module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.removeColumn(
      'health_records', // name of Source model
      'patient_id'
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'health_records',
      'patient_id',
      {
        type: Sequelize.UUID
      }
    );
  }
};