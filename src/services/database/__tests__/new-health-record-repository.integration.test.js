import { v4 as uuid } from 'uuid';
import {
  getHealthRecordStatus,
  updateHealthRecordCompleteness,
  HealthRecordStatus
} from '../new-health-record-repository';
import ModelFactory from '../../../models';
import { modelName as healthRecordModelName } from '../../../models/health-record-new';
import { MessageType, modelName as messageModelName } from '../../../models/message';
import { logError } from '../../../middleware/logging';

jest.mock('../../../middleware/logging');

describe('healthRecordRepository', () => {
  const HealthRecord = ModelFactory.getByName(healthRecordModelName);
  const Message = ModelFactory.getByName(messageModelName);

  afterAll(async () => {
    await ModelFactory.sequelize.close();
  });

  describe('getHealthRecordStatus', () => {
    it("should return status 'complete' when health record 'completedAt' field is not null", async () => {
      const conversationId = uuid();
      const nhsNumber = '1234567890';

      await HealthRecord.create({ conversationId, nhsNumber, completedAt: new Date() });
      const status = await getHealthRecordStatus(conversationId);

      expect(status).toEqual(HealthRecordStatus.COMPLETE);
    });

    it("should return status 'pending' when health record 'completedAt' field is null", async () => {
      const conversationId = uuid();
      const nhsNumber = '1234567890';

      await HealthRecord.create({ conversationId, nhsNumber, completedAt: null });
      const status = await getHealthRecordStatus(conversationId);

      expect(status).toEqual(HealthRecordStatus.PENDING);
    });

    it("should return status 'notFound' when health record is not found", async () => {
      const conversationId = uuid();
      const status = await getHealthRecordStatus(conversationId);

      expect(status).toEqual(HealthRecordStatus.NOT_FOUND);
    });

    it('should throw error if there is a problem retrieving health record from database', async () => {
      const conversationId = 'not-a-uuid';

      let caughtException = null;
      try {
        await getHealthRecordStatus(conversationId);
      } catch (e) {
        caughtException = e;
      }
      expect(caughtException).not.toBeNull();
      expect(logError).toHaveBeenCalledWith(
        'Health Record could not be retrieved from database',
        caughtException
      );
    });
  });

  describe('updateHealthRecordCompleteness', () => {
    it("should set 'completedAt' property for a small health record", async () => {
      const conversationId = uuid();
      const messageId = uuid();
      const nhsNumber = '1234567890';

      await HealthRecord.create({ conversationId, nhsNumber, completedAt: null });
      await Message.create({
        conversationId,
        messageId,
        type: MessageType.EHR_EXTRACT,
        receivedAt: new Date()
      });

      await updateHealthRecordCompleteness(conversationId);
      const healthRecord = await HealthRecord.findByPk(conversationId);

      expect(healthRecord.completedAt).not.toBeNull();
    });
  });
});
