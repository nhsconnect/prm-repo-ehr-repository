import S3Service from './s3';
import { logEvent } from '../../middleware/logging';

const getSignedUrl = (conversationId, messageId, operation) => {
  logEvent('Retrieving pre-signed URL');
  conversationId = conversationId.toLowerCase();
  messageId = messageId.toLowerCase();
  const s3Service = new S3Service(`${conversationId}/${messageId}`);
  return s3Service.getPresignedUrl(operation);
};

export default getSignedUrl;
