import { v4 as uuid } from 'uuid';
import {
  getHealthRecordStatus,
  updateHealthRecordCompleteness,
  HealthRecordStatus
} from '../new-health-record-repository';
import ModelFactory from '../../../models';
import { modelName as healthRecordModelName } from '../../../models/health-record-new';
import { MessageType, modelName as messageModelName } from '../../../models/message';

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
