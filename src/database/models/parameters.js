const getParameters = (tableName) => ({
    tableName: tableName,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
    timestamps: true,
    schema: "public",
    paranoid: true
});

module.exports = getParameters;
