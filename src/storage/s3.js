import {S3} from "aws-sdk";
import config from "../config";

const getUrl = (key) =>
    new Promise(async resolve => {
        const s3 = new S3();
        const parameters = {
            Bucket: config.awsS3BucketName,
            Key: key,
            Expires: 60,
            ContentType:'text/xml',
            ACL: 'public-read'
        };

      const url = await new Promise((resolve, reject) => {
        s3.getSignedUrl('putObject', params, function (err, url) {
          if (err) {
            reject(err)
          }
          //console.log(url)
          resolve(url)
        })
      });
      return url
    });


export default getUrl;
