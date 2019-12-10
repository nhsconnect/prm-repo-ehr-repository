import getUrl from '../storage/s3'
import uuid from 'uuid/v4';

const getSignedUrl = (conversationId) => {
  if (process.env.NODE_ENV === 'local') {
    return 'http://example.com';
  }

  return getUrl(`${conversationId}/${uuid()}`);
};

export default getSignedUrl