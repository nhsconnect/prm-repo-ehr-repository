"use strict";

const modelName = "Patient";

const modelParameters = require("./parameters")("patients");

const model = (dataType) => {
    return {
        id: {
            type: dataType.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        slug: {
            type: dataType.UUID,
            unique: true,
            allowNull: false
        },
        nhs_number: {
            type: dataType.STRING(100),
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

  const Patient = sequelize.define(modelName, model(DataTypes), modelParameters);

  Patient.associate = function(models) {
    // associations can be defined here

    // ONE to ONE -> Health Record
  };

  return Patient;
};