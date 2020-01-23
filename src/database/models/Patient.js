import getParameters from './parameters';

const modelName = 'Patient';
const tableName = 'patients';

const model = dataType => {
  return {
    id: {
      type: dataType.UUID,
      primaryKey: true,
      defaultValue: dataType.UUIDV4
    },
    nhs_number: {
      type: dataType.CHAR(10),
      unique: true,
      allowNull: false
    },
    deleted_at: {
      type: dataType.DATE
    },
    created_at: {
      type: dataType.DATE,
      allowNull: false
    },
    updated_at: {
      type: dataType.DATE,
      allowNull: false
    }
  };
};

module.exports = (sequelize, DataTypes) => {
  const Patient = sequelize.define(modelName, model(DataTypes), getParameters(tableName));

  Patient.associate = models => {
    Patient.hasMany(models.HealthRecord, { foreignKey: 'patient_id' });
  };

  Patient.findOrCreateOne = (nhsNumber, transaction) => {
    return Patient.findOrCreate({ where: nhsNumber, transaction: transaction }).then(patients => {
      return Promise.resolve(patients[0]);
    });
  };

  return Patient;
};
