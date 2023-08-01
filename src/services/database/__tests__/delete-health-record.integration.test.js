import { createEhrExtract, findAllMessagesByConversationId } from '../message-repository';
import { NoMessageFoundError, NoS3ObjectsFoundError } from '../../../errors/errors';
import { modelName as healthRecordModelName } from '../../../models/health-record';
import { findHealthRecordByConversationId } from '../health-record-repository';
import { modelName as messageModelName } from '../../../models/message';
import { deleteHealthRecordAndMessages } from '../delete-health-record';
import {
  generateRandomNhsNumber,
  generateMultipleUUID,
  generateRandomUUID,
} from '../../../utilities/integration-test-utilities';
import { logError } from '../../../middleware/logging';
import ModelFactory from '../../../models';
import S3Service from '../../storage/s3';

// Mocking
jest.mock('../../storage/s3');
jest.mock('../../../middleware/logging');

describe('delete-health-record.js', () => {
  // ========================= COMMON PROPERTIES =========================
  const HealthRecord = ModelFactory.getByName(healthRecordModelName);
  const Message = ModelFactory.getByName(messageModelName);
  // =====================================================================

  // ========================= SET UP / TEAR DOWN ========================
  beforeEach(async () => {
    await HealthRecord.truncate();
    await Message.truncate();
    await ModelFactory.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await ModelFactory.sequelize.close();
  });
  // =====================================================================

  describe('deleteHealthRecordAndMessages', () => {
    it('should delete the health record and messages successfully, given a valid conversation ID', async () => {
      // given
      const [messageId, conversationId] = generateMultipleUUID(2, false);
      const fragmentMessageIds = generateMultipleUUID(5, false);
      const nhsNumber = generateRandomNhsNumber();

      // when
      const deleteObjectsByPrefix = jest.fn();
      S3Service.mockImplementation(() => {
        return {
          deleteObjectsByPrefix: deleteObjectsByPrefix,
        };
      });

      await createEhrExtract({
        conversationId,
        messageId,
        nhsNumber,
        fragmentMessageIds,
      });

      await deleteHealthRecordAndMessages(conversationId);

      const foundMessages = await findAllMessagesByConversationId(conversationId);
      const healthRecord = await findHealthRecordByConversationId(conversationId);

      // then
      expect(foundMessages).toEqual([]);
      expect(healthRecord).toBeNull();
      expect(deleteObjectsByPrefix).toBeCalledTimes(1);
      expect(deleteObjectsByPrefix).toBeCalledWith(`${conversationId}/`);
    });

    it('should throw an error, given an invalid conversation ID', async () => {
      // given
      const conversationId = generateRandomUUID(false);

      // when
      S3Service.mockImplementation(() => {
        return {
          deleteObjectsByPrefix: jest.fn().mockResolvedValueOnce(undefined),
        };
      });

      // then
      await expect(() => deleteHealthRecordAndMessages(conversationId)).rejects.toThrow(
        NoMessageFoundError
      );
    });

    it('should throw an error, given an error occurs within the S3 process', async () => {
      // given
      const [messageId, conversationId] = generateMultipleUUID(2, false);
      const fragmentMessageIds = generateMultipleUUID(5, false);
      const nhsNumber = generateRandomNhsNumber();

      // when
      S3Service.mockImplementation(() => {
        return {
          deleteObjectsByPrefix: jest.fn().mockRejectedValueOnce(new NoS3ObjectsFoundError()),
        };
      });

      await createEhrExtract({
        conversationId,
        messageId,
        nhsNumber,
        fragmentMessageIds,
      });

      // then
      await expect(() => deleteHealthRecordAndMessages(conversationId)).rejects.toThrow(
        NoS3ObjectsFoundError
      );
      expect(logError).toBeCalledTimes(2);
    });
  });
});
