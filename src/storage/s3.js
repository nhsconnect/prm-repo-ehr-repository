import {S3} from "aws-sdk";
import config from "../config";

const getUrl = (key) =>
    new Promise(resolve => {
        const s3 = new S3();
        const parameters = {
            Bucket: config.awsS3BucketName,
            Key: key,
            Expires: 60,
            ContentType:'text/xml',
            ACL: 'public-read'
        };

        s3.getSignedUrl('putObject', parameters, () => {
            resolve(key)
        });
    });


export default getUrl;
