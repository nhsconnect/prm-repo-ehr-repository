const config = {
    awsS3BucketName: `${process.env.NODE_ENV}-ehr-repo-bucket`,
    databaseUser: process.env.DATABASE_USER,
    databasePassword: process.env.DATABASE_PASSWORD,
    databaseName: process.env.DATABASE_NAME
};

export default config;