import S3Service from '../storage/s3';
import { updateLogEvent } from '../middleware/logging';

const getSignedUrl = (conversationId, messageId) => {
  updateLogEvent({ status: 'Retrieving presigned URL' });

  const s3Service = new S3Service(`${conversationId}/${messageId}`);
  return s3Service.getPresignedUrl();
};

export default getSignedUrl;
