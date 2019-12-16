import { getUrl } from '../storage/s3';
import uuid from 'uuid/v4';
import { updateLogEvent } from '../middleware/logging';

const getSignedUrl = conversationId => {
  updateLogEvent({
    status: 'Start getting singed url'
  });
  if (process.env.NODE_ENV === 'local') {
    return Promise.resolve('http://example.com');
  }
  return getUrl(`${conversationId}/${uuid()}`);
};

export default getSignedUrl;
