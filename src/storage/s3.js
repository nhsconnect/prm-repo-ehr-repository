import {S3} from "aws-sdk";
import config from "../config";

const getUrl = (key) => {
  const s3 = new S3();

  const parameters = {
    Bucket: config.awsS3BucketName,
    Key: key,
    Expires: 60,
    ContentType: 'text/xml',
    ACL: 'public-read'
  };

  const url= new Promise((resolve, reject) => {
    s3.getSignedUrl('putObject', parameters, function (err, url) {
      if(err){
        reject(err);
      }
      resolve(url);
    })
  });
  return url;

};

export default getUrl;
