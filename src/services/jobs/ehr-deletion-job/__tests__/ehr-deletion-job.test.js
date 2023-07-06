import { findAllSoftDeletedHealthRecords } from '../../../database/health-record-repository';
import { expect, jest, afterEach, beforeEach, describe, it } from '@jest/globals';
import { checkDateAndDelete } from '../check-date-delete';
import { loggerPrefix } from '../ehr-deletion-job-common';
import { logInfo } from '../../../../middleware/logging';
import { ehrDeletionJob } from '../ehr-deletion-job';
import { getHealthRecords } from './test-utilities';
import moment from 'moment/moment';

// Mocking
jest.mock('../../../database/health-record-repository');
jest.mock('../check-date-delete');
jest.mock('../../../../middleware/logging');

const flushPromises = async () => {
  // utility function to wait for pending promises in background to complete first
  return new Promise((resolve) => jest.requireActual('timers').setImmediate(resolve));
};

describe('ehr-deletion-job.js', () => {
  // ========================= COMMON PROPERTIES =========================
  const TWENTY_SECOND_TIMEOUT = 20000;
  const TWO_MINUTES_TIMEOUT = 1000 * 60 * 2;

  jest.useFakeTimers();

  const timeframes = {
    DAY: 1000 * 60 * 60 * 24,
    WEEK: 1000 * 60 * 60 * 24 * 7,
  };

  const date = moment().subtract(8, 'weeks').toISOString();

  const healthRecord = getHealthRecords(date, date, date, date, false);
  // =====================================================================

  beforeEach(() => {
    ehrDeletionJob.start();
  });

  afterEach(() => {
    ehrDeletionJob.stop();
    jest.resetAllMocks();
  });

  it(
    'should schedule the job once per day at 3am',
    async () => {
      // when
      findAllSoftDeletedHealthRecords.mockResolvedValueOnce([]);

      jest.advanceTimersByTime(timeframes.DAY);
      await flushPromises();

      // then
      expect(findAllSoftDeletedHealthRecords).toBeCalledTimes(1);
      expect(logInfo).toBeCalledTimes(2);
      expect(checkDateAndDelete).toBeCalledTimes(0);
    },
    TWENTY_SECOND_TIMEOUT
  );

  it(
    'should schedule the job once per day at 3am, for 7 days',
    async () => {
      // when
      findAllSoftDeletedHealthRecords.mockResolvedValue([]);

      jest.advanceTimersByTime(timeframes.WEEK);
      await flushPromises();

      // then
      expect(findAllSoftDeletedHealthRecords).toBeCalledTimes(7);
      expect(logInfo).toBeCalledTimes(14);
      expect(checkDateAndDelete).toBeCalledTimes(0);
    },
    TWO_MINUTES_TIMEOUT
  );

  it(
    'should run check date and delete if there is a health record present',
    async () => {
      // when
      findAllSoftDeletedHealthRecords.mockResolvedValueOnce(healthRecord);
      checkDateAndDelete.mockResolvedValueOnce(undefined);

      jest.advanceTimersByTime(timeframes.DAY);
      await flushPromises();

      // then
      expect(findAllSoftDeletedHealthRecords).toBeCalledTimes(1);
      expect(checkDateAndDelete).toBeCalledTimes(1);
      expect(logInfo).toBeCalledTimes(1);
    },
    TWENTY_SECOND_TIMEOUT
  );

  it(
    'should not run check date and delete if there is no health record present',
    async () => {
      // when
      findAllSoftDeletedHealthRecords.mockResolvedValueOnce([]);

      jest.advanceTimersByTime(timeframes.DAY);
      await flushPromises();

      // then
      expect(logInfo).toBeCalledTimes(2);
      expect(logInfo).toBeCalledWith(
        `${loggerPrefix} Job triggered, preparing to delete health records.`
      );
      expect(logInfo).toBeCalledWith(
        `${loggerPrefix} Could not find any health records that are marked for deletion.`
      );
    },
    TWENTY_SECOND_TIMEOUT
  );
});
