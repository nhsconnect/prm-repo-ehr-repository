import { findAllSoftDeletedHealthRecords } from '../../../database/health-record-repository';
import { expect, jest, afterEach, beforeEach, describe, it } from '@jest/globals';
import { checkDateAndDelete } from '../check-date-delete';
import { loggerPrefix } from '../ehr-deletion-job-common';
import { logInfo } from '../../../../middleware/logging';
import { ehrDeletionJob } from '../ehr-deletion-job';
import { getHealthRecords } from './test-utilities';
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

  const healthRecord = getHealthRecords(moment().subtract(8, 'weeks').toISOString(), false);
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
      `${loggerPrefix} Job triggered, preparing to delete health records.`
    );
    expect(logInfo).toBeCalledWith(
      `${loggerPrefix} Could not find any health records that are marked for deletion.`
    );
  });
});