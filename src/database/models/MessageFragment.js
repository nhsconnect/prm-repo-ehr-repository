"use strict";

const modelName = "MessageFragment";

const modelParameters = require("./parameters")("message_fragments");

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

    const MessageFragment = sequelize.define(modelName, model(DataTypes), modelParameters);

    MessageFragment.associate = function(models) {

    };

    MessageFragment.complete = (options) => {
        return MessageFragment.update({
            transfer_completed_at: new Date()
        }, options);
    };

    return MessageFragment;
};