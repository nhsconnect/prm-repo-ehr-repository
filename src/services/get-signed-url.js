import S3Service from '../storage/s3';

const getSignedUrl = (conversationId, messageId) => {
  return new S3Service(`${conversationId}/${messageId}`).getPutSignedUrl();
};

export default getSignedUrl;
