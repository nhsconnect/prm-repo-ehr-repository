import getUrl from '../storage/s3'
import uuid from 'uuid/v4';

const getSignedUrl = (registrationId, conversationId) => {
  if (process.env.NODE_ENV === 'local') {
    return 'http://example.com';
  }

  return getUrl(`${registrationId}/${conversationId}/${uuid()}`);
};

export default getSignedUrl