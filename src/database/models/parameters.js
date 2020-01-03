const getParameters = (modelName) => ({
    tableName: modelName + "s",
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    timestamps: true,
    schema: "public",
    paranoid: true
});

module.exports = getParameters;
