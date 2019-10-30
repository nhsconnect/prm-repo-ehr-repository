const config = {
    awsS3BucketName: `deductions-${process.env.NODE_ENV}`,
    databaseUser: process.env.DATABASE_USER,
    databasePassword: process.env.DATABASE_PASSWORD,
    databaseName: process.env.DATABASE_NAME
};

export default config;