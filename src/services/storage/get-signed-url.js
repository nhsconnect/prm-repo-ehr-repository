import S3Service from './s3';
import { logInfo } from '../../middleware/logging';

const getSignedUrl = (conversationId, messageId, operation) => {
  logInfo('Retrieving pre-signed URL');
  conversationId = conversationId.toLowerCase();
  messageId = messageId.toLowerCase();
  const s3Service = new S3Service(`${conversationId}/${messageId}`);
  return s3Service.getPresignedUrl(operation);
};

export default getSignedUrl;
