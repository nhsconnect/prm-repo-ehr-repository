import {S3} from "aws-sdk";
import uuid from 'uuid/v4';
import config from "../config";

const save = (data, nhsNumber) =>
    new Promise(resolve => {
        const s3 = new S3();
        const key = `${nhsNumber}/${uuid()}`;
        const parameters = {
            Bucket: config.awsS3BucketName,
            Key: key,
            Body: data
        };

        s3.putObject(parameters, () => {
            resolve(key)
        });
    });

export default save;
