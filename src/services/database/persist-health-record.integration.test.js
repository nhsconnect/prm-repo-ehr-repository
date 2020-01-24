import { createAndLinkEntries } from './persist-health-record';
import { updateLogEvent, updateLogEventWithError } from '../../middleware/logging';
import ModelFactory from '../../models';
import uuid from 'uuid/v4';

jest.mock('uuid/v4');
jest.mock('../../middleware/logging', () => mockLoggingMiddleware());
jest.mock('express-winston', () => mockExpressWinston());

describe('persistHealthRecord', () => {
  const sequelize = ModelFactory.sequelize;

  const MessageFragment = ModelFactory.getByName('MessageFragment');
  const HealthRecord = ModelFactory.getByName('HealthRecord');
  const Patient = ModelFactory.getByName('Patient');

  const testUUID = 'da057d2f-3fcb-4e3b-a837-03d015daf5a5';

  const nhsNumber = '1234567890';
  const conversationId = '099cd501-034f-4e17-a461-cf4fd93ae0cf';
  const messageId = 'df13fc7b-89f7-4f80-b31c-b9720ac40296';
  const manifest = ['df13fc7b-89f7-4f80-b31c-b9720ac40296', '636c1aae-0fe5-4f46-9e99-a7d46ec55ef9'];

  beforeEach(() => uuid.mockImplementation(() => testUUID));
  afterEach(() => jest.clearAllMocks());
  afterAll(() => sequelize.close());

  it('should call updateLogEvent if data persisted correctly', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(nhsNumber, conversationId, messageId, manifest, t)
        .then(() => {
          expect(updateLogEvent).toHaveBeenCalledTimes(1);
          return expect(updateLogEvent).toHaveBeenCalledWith({
            status: 'Meta-data has been persisted'
          });
        })
        .finally(() => t.rollback())
    );
  });

  it('should make message fragment with message id', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(nhsNumber, conversationId, messageId, manifest, t)
        .then(() =>
          MessageFragment.findOne({
            where: {
              message_id: messageId
            },
            transaction: t
          })
        )
        .then(fragment => {
          expect(fragment).not.toBeNull();
          return expect(fragment.get().message_id).toBe(messageId);
        })
        .finally(() => t.rollback())
    );
  });

  it('should make health record with conversation id', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(nhsNumber, conversationId, messageId, manifest, t)
        .then(() =>
          HealthRecord.findOne({
            where: {
              conversation_id: conversationId
            },
            transaction: t
          })
        )
        .then(healthRecord => {
          expect(healthRecord).not.toBeNull();
          return expect(healthRecord.get().conversation_id).toBe(conversationId);
        })
        .finally(() => t.rollback())
    );
  });

  it('should make patient with nhs number', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(nhsNumber, conversationId, messageId, manifest, t)
        .then(() =>
          Patient.findOne({
            where: {
              nhs_number: nhsNumber
            },
            transaction: t
          })
        )
        .then(patient => {
          expect(patient).not.toBeNull();
          return expect(patient.get().nhs_number).toBe(nhsNumber);
        })
        .finally(() => t.rollback())
    );
  });

  it('should propagate and log errors from invalid nhs number', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries('1234', conversationId, messageId, manifest, t)
        .catch(error => {
          expect(updateLogEventWithError).toHaveBeenCalledTimes(1);
          expect(updateLogEventWithError).toHaveBeenCalledWith(error);
          return expect(error.message).toContain('Validation len on nhs_number failed');
        })
        .finally(() => t.rollback())
    );
  });

  it('should propagate and log errors from invalid conversation id', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(nhsNumber, 'invalid', messageId, manifest, t)
        .catch(error => {
          expect(updateLogEventWithError).toHaveBeenCalledTimes(1);
          expect(updateLogEventWithError).toHaveBeenCalledWith(error);
          return expect(error.message).toBe('invalid input syntax for type uuid: "invalid"');
        })
        .finally(() => t.rollback())
    );
  });

  it('should propagate and log errors from invalid message id', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(nhsNumber, conversationId, 'invalid', manifest, t)
        .catch(error => {
          expect(updateLogEventWithError).toHaveBeenCalledTimes(1);
          expect(updateLogEventWithError).toHaveBeenCalledWith(error);
          return expect(error.message).toBe('invalid input syntax for type uuid: "invalid"');
        })
        .finally(() => t.rollback())
    );
  });

  it('should create association between message fragment and health record', () => {
    return sequelize.transaction().then(t =>
      createAndLinkEntries(nhsNumber, conversationId, messageId, manifest, t)
        .then(() =>
          MessageFragment.findOne({
            where: {
              message_id: messageId
            },
            transaction: t
          })
        )
        .then(fragment => fragment.getHealthRecord({ transaction: t }))
        .then(healthRecord => {
          expect(healthRecord).not.toBeNull();
          return expect(healthRecord.get().conversation_id).toBe(conversationId);
        })
        .finally(() => t.commit())
    );
  });
});

function mockLoggingMiddleware() {
  const original = jest.requireActual('../../middleware/logging');
  return {
    ...original,
    updateLogEvent: jest.fn(),
    updateLogEventWithError: jest.fn()
  };
}

function mockExpressWinston() {
  return {
    errorLogger: () => (req, res, next) => next(),
    logger: () => (req, res, next) => next()
  };
}
