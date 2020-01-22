module.exports = {
  up: (queryInterface, Sequelize) => {

    return queryInterface.addColumn(
      'health_records', // name of Source model
      'patient_id', // name of the key we're adding
      {
        type: Sequelize.UUID,
        references: {
          model: 'patients', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'health_records', // name of Source model
      'patient_id' // key we want to remove
    );
  }
};