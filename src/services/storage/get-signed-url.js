import S3Service from './s3';
import { logEvent } from '../../middleware/logging';

const getSignedUrl = (conversationId, messageId) => {
  logEvent('Retrieving pre-signed URL');

  const s3Service = new S3Service(`${conversationId}/${messageId}`);
  return s3Service.getPresignedUrl();
};

export default getSignedUrl;
