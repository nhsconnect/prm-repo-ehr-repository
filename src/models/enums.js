export const QueryType = {
  ALL: 'ALL',
  CONVERSATION: 'Conversation',
  CORE: 'Core',
  FRAGMENT: 'Fragment',
};

export const ConversationStates = {
  STARTED: 'INBOUND_STARTED',
  REQUEST_SENT: 'INBOUND_REQUEST_SENT',
  CONTINUE_REQUEST_SENT: 'INBOUND_CONTINUE_REQUEST_SENT',
  COMPLETE: 'INBOUND_COMPLETE',
  FAILED: 'INBOUND_FAILED',
  TIMEOUT: 'INBOUND_TIMEOUT',
};

export const CoreStates = {
  COMPLETE: 'INBOUND_COMPLETE',
};

export const FragmentStates = {
  PENDING: 'INBOUND_REQUEST_SENT',
  COMPLETE: 'INBOUND_COMPLETE',
};

Object.freeze(QueryType);
Object.freeze(ConversationStates);
Object.freeze(CoreStates);
Object.freeze(FragmentStates);
