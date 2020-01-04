"use strict";

const modelName = "HealthRecordManifest";

const modelParameters = require("./parameters")("health_record_manifests");

const model = (dataType) => ({
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
    conversation_id: {
        type: dataType.STRING(100),
        unique: true,
        allowNull: false
    },
    transfer_completed_at: dataType.DATE,
    deleted_at: dataType.DATE,
    created_at: {
        type: dataType.DATE,
        allowNull: false
    },
    updated_at: {
        type: dataType.DATE,
        allowNull: false
    }
});

module.exports = (sequelize, DataTypes) => {

    const HealthRecordManifest = sequelize.define(modelName, model(DataTypes), modelParameters);

    HealthRecordManifest.associate = function(models) {
        //IN:  ONE (HealthRecord) to ONE (HealthRecordManifest)
        //OUT: ONE (HealthRecordManfiest) to MANY (MessageFragment)
    };

    HealthRecordManifest.complete = (options) => {
        return HealthRecordManifest.update({
            transfer_completed_at: new Date()
        }, options);
    };

    return HealthRecordManifest;
};