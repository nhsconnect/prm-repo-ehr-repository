import { permanentlyDeleteEhrFromRepoAndDb } from '../delete-from-repo-db';
import { checkDateAndDelete } from '../check-date-delete';
import { logInfo } from '../../../../middleware/logging';
import { getHealthRecords } from './test-utilities';
import moment from 'moment/moment';

// Mocking
jest.mock('../../../../middleware/logging');
jest.mock('../delete-from-repo-db');

describe('check-date-delete.js', () => {
  it('should permanently delete a health record from the repo and DB, given a health record with a soft deleted date of greater than 8 weeks', async () => {
    // given
    const healthRecord = getHealthRecords(moment().subtract(8, 'weeks').toISOString(), false);
    const { conversationId } = healthRecord[0];

    // when
    permanentlyDeleteEhrFromRepoAndDb.mockResolvedValueOnce(undefined);
    await checkDateAndDelete(healthRecord);

    // then
    expect(permanentlyDeleteEhrFromRepoAndDb).toBeCalledTimes(1);
    expect(logInfo).toBeCalledTimes(3);
    expect(logInfo).toBeCalledWith(
      '[SCHEDULED JOB] [HEALTH RECORD S3 DELETIONS] - Identifying health records with a soft deletion date greater than or equal to 8 weeks.'
    );
    expect(logInfo).toBeCalledWith(
      `[SCHEDULED JOB] [HEALTH RECORD S3 DELETIONS] - Record found with Conversation ID: ${conversationId}, deleting...`
    );
    expect(logInfo).toBeCalledWith(
      '[SCHEDULED JOB] [HEALTH RECORD S3 DELETIONS] - 0 health records skipped, 1 deleted.'
    );
  });

  it('should permanently delete a health record from the repo and DB, given multiple health records with a soft deleted date of greater than 8 weeks', async () => {
    // given
    const healthRecords = getHealthRecords(moment().subtract(8, 'weeks').toISOString(), true);

    // when
    permanentlyDeleteEhrFromRepoAndDb.mockResolvedValueOnce(undefined);
    await checkDateAndDelete(healthRecords);

    // then
    expect(permanentlyDeleteEhrFromRepoAndDb).toBeCalledTimes(5);
    expect(logInfo).toBeCalledTimes(7);
    expect(logInfo).toBeCalledWith(
      '[SCHEDULED JOB] [HEALTH RECORD S3 DELETIONS] - 0 health records skipped, 5 deleted.'
    );
  });

  it('should not delete a health record, given a health record with a soft deleted date of less than 8 weeks', async () => {
    // given
    const healthRecord = getHealthRecords(moment().subtract(2, 'weeks').toISOString(), false);

    // when
    await checkDateAndDelete(healthRecord);

    // then
    expect(logInfo).toBeCalledTimes(2);
    expect(logInfo).toBeCalledWith(
      '[SCHEDULED JOB] [HEALTH RECORD S3 DELETIONS] - Identifying health records with a soft deletion date greater than or equal to 8 weeks.'
    );
    expect(logInfo).toBeCalledWith(
      '[SCHEDULED JOB] [HEALTH RECORD S3 DELETIONS] - No health records were deleted.'
    );
  });
});
