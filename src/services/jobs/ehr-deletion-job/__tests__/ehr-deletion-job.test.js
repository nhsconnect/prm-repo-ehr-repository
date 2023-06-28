import { findAllSoftDeletedHealthRecords } from '../../../database/health-record-repository';
import { expect, jest, afterEach, beforeEach, describe, it } from '@jest/globals';
import { checkDateAndDelete } from '../check-date-delete';
import { logInfo } from '../../../../middleware/logging';
import { getOneHealthRecord } from './test-utilities';
import { ehrDeletionJob } from '../ehr-deletion-job';
import moment from 'moment/moment';
import { now } from 'moment';
import sinon from 'sinon';

// Mocking
jest.mock('../../../database/health-record-repository');
jest.mock('../check-date-delete');
jest.mock('../../../../middleware/logging');

describe('ehr-deletion-job.js', () => {
  // ========================= COMMON PROPERTIES =========================
  const clock = sinon.useFakeTimers({
    now: now(),
    shouldClearNativeTimers: true,
  });

  const timeframes = {
    DAY: 1000 * 60 * 60 * 24,
    WEEK: 1000 * 60 * 60 * 24 * 7,
    FORTNIGHTLY: 1000 * 60 * 60 * 24 * 14,
  };

  const healthRecord = getOneHealthRecord(moment().subtract(8, 'weeks').toISOString());
  // =====================================================================

  beforeEach(() => {
    ehrDeletionJob.start();
  });

  afterEach(() => {
    ehrDeletionJob.stop();
    sinon.restore();
    jest.resetAllMocks();
  });

  it('should schedule the job once per day at 3am', async () => {
    // when
    findAllSoftDeletedHealthRecords.mockResolvedValueOnce([]);

    await clock.tickAsync(timeframes.DAY);

    // then
    expect(findAllSoftDeletedHealthRecords).toBeCalledTimes(1);
    expect(logInfo).toBeCalledTimes(2);
  });

  it('should schedule the job once per day at 3am, for 7 days', async () => {
    // when
    findAllSoftDeletedHealthRecords.mockResolvedValueOnce([]);

    await clock.tickAsync(timeframes.WEEK);

    // then
    expect(findAllSoftDeletedHealthRecords).toBeCalledTimes(7);
    expect(logInfo).toBeCalledTimes(14);
  });

  it('should schedule the job once per day at 3am, for 14 days', async () => {
    // when
    findAllSoftDeletedHealthRecords.mockResolvedValueOnce([]);

    await clock.tickAsync(timeframes.FORTNIGHTLY);

    // then
    expect(findAllSoftDeletedHealthRecords).toBeCalledTimes(14);
    expect(logInfo).toBeCalledTimes(28);
  });

  it('should run check date and delete if there is a health record present', async () => {
    // when
    findAllSoftDeletedHealthRecords.mockResolvedValueOnce(healthRecord);
    checkDateAndDelete.mockResolvedValueOnce(undefined);

    await clock.tickAsync(timeframes.DAY);

    // then
    expect(findAllSoftDeletedHealthRecords).toBeCalledTimes(1);
    expect(checkDateAndDelete).toBeCalledTimes(1);
    expect(logInfo).toBeCalledTimes(1);
  });

  it('should not run check date and delete if there is no health record present', async () => {
    // when
    findAllSoftDeletedHealthRecords.mockResolvedValueOnce([]);

    await clock.tickAsync(timeframes.DAY);

    // then
    expect(logInfo).toBeCalledTimes(2);
    expect(logInfo).toBeCalledWith(
      '[SCHEDULED JOB] [HEALTH RECORD S3 DELETIONS] - Job triggered, preparing to delete health records.'
    );
    expect(logInfo).toBeCalledWith(
      '[SCHEDULED JOB] [HEALTH RECORD S3 DELETIONS] - Could not find any health records that are marked for deletion.'
    );
  });
});
