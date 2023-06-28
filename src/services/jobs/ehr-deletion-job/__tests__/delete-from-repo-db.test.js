import { hardDeleteHealthRecordByConversationId } from '../../../database/health-record-repository';
import { hardDeleteAllMessagesByConversationId } from '../../../database/message-repository';
import { permanentlyDeleteEhrFromRepoAndDb } from '../delete-from-repo-db';
import { logError, logInfo } from '../../../../middleware/logging';
import { loggerPrefix } from '../ehr-deletion-job-common';
import { getHealthRecords } from './test-utilities';
import moment from 'moment/moment';

// Mocking
jest.mock('../../../database/message-repository');
jest.mock('../../../database/health-record-repository');
jest.mock('../../../storage/s3');
jest.mock('../../../../middleware/logging');

describe('delete-from-repo-db.js', () => {
  // ========================= COMMON PROPERTIES =========================
  const healthRecord = getHealthRecords(moment().subtract(8, 'weeks').toISOString(), false);
  const { conversationId } = healthRecord[0];
  // =====================================================================

  it('should permanently delete the EHR from the repo and S3 successfully, given a valid health record', async () => {
    // when
    hardDeleteAllMessagesByConversationId.mockResolvedValueOnce(undefined);
    hardDeleteHealthRecordByConversationId.mockResolvedValueOnce(undefined);

    await permanentlyDeleteEhrFromRepoAndDb(healthRecord[0]);

    // then
    expect(hardDeleteAllMessagesByConversationId).toBeCalledTimes(1);
    expect(hardDeleteHealthRecordByConversationId).toBeCalledTimes(1);
    expect(logInfo).toBeCalledTimes(1);
    expect(logInfo).toHaveBeenCalledWith(
      `${loggerPrefix} Successfully deleted health record with Conversation ID ${conversationId} from S3, and associated records within the database.`
    );
  });

  it('should fail to delete the EHR from the repo and S3, given an invalid conversation ID', async () => {
    // when
    hardDeleteAllMessagesByConversationId.mockRejectedValueOnce();

    await permanentlyDeleteEhrFromRepoAndDb(healthRecord[0]);

    // then
    expect(hardDeleteAllMessagesByConversationId).toBeCalledTimes(1);
    expect(logError).toBeCalledTimes(1);
    expect(logError).toBeCalledWith(
      `${loggerPrefix} Failed to delete health record with conversation ID ${conversationId}, more details: - undefined`
    );
  });
});
