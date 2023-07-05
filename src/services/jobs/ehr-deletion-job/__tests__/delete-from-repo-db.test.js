import { deleteHealthRecordAndMessages } from '../../../database/delete-health-record';
import { permanentlyDeleteEhrFromRepoAndDb } from '../delete-from-repo-db';
import { logError, logInfo } from '../../../../middleware/logging';
import { loggerPrefix } from '../ehr-deletion-job-common';
import { getHealthRecords } from './test-utilities';
import moment from 'moment/moment';

// Mocking
jest.mock('../../../database/delete-health-record');
jest.mock('../../../../middleware/logging');

describe('delete-from-repo-db.js', () => {
  // ========================= COMMON PROPERTIES =========================
  const date = moment().subtract(8, 'weeks').toISOString();
  const healthRecord = getHealthRecords(date, date, date, date, false);
  const { conversationId } = healthRecord[0];
  // =====================================================================

  it('should permanently delete the health record from the repo and S3 successfully, given a valid health record', async () => {
    // when
    deleteHealthRecordAndMessages.mockResolvedValueOnce(undefined);

    await permanentlyDeleteEhrFromRepoAndDb(healthRecord[0]);

    // then
    expect(deleteHealthRecordAndMessages).toBeCalledTimes(1);
    expect(logInfo).toBeCalledTimes(1);
    expect(logInfo).toHaveBeenCalledWith(
      `${loggerPrefix} Successfully deleted health record with Conversation ID ${conversationId} from S3, and associated records within the database.`
    );
  });

  it('should fail to delete the health record from the database, given an invalid conversation ID', async () => {
    // when
    deleteHealthRecordAndMessages.mockRejectedValueOnce();

    await permanentlyDeleteEhrFromRepoAndDb(healthRecord[0]);

    // then
    expect(deleteHealthRecordAndMessages).toBeCalledTimes(1);
    expect(logError).toBeCalledTimes(1);
    expect(logError).toBeCalledWith(
      `${loggerPrefix} Failed to delete health record with conversation ID ${conversationId}.`,
      undefined
    );
  });
});
