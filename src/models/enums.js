export const RecordType = {
  ALL: 'ALL',
  CONVERSATION: 'Conversation',
  CORE: 'Core',
  FRAGMENT: 'Fragment',
};

export const ConversationStatus = {
  STARTED: 'INBOUND_STARTED',
  REQUEST_SENT: 'INBOUND_REQUEST_SENT',
  CONTINUE_REQUEST_SENT: 'INBOUND_CONTINUE_REQUEST_SENT',
  COMPLETE: 'INBOUND_COMPLETE',
  FAILED: 'INBOUND_FAILED',
  TIMEOUT: 'INBOUND_TIMEOUT',
};

export const CoreStatus = {
  COMPLETE: 'INBOUND_COMPLETE',
};

export const FragmentStatus = {
  PENDING: 'INBOUND_REQUEST_SENT',
  COMPLETE: 'INBOUND_COMPLETE',
};

export const HealthRecordStatus = {
  COMPLETE: 'complete',
  PENDING: 'pending',
  NOT_FOUND: 'notFound',
};

export const MessageType = {
  EHR_EXTRACT: 'ehrExtract',
  FRAGMENT: 'fragment',
};

Object.freeze(HealthRecordStatus);
Object.freeze(RecordType);
Object.freeze(ConversationStatus);
Object.freeze(CoreStatus);
Object.freeze(FragmentStatus);
Object.freeze(MessageType);
