import { permanentlyDeleteEhrFromRepoAndDb } from '../delete-from-repo-db';
import { checkDateAndDelete } from '../check-date-delete';
import { logInfo } from '../../../../middleware/logging';
import { getHealthRecords } from './test-utilities';
import moment from 'moment/moment';
import { loggerPrefix } from '../ehr-deletion-job-common';

// Mocking
jest.mock('../../../../middleware/logging');
jest.mock('../delete-from-repo-db');

describe('check-date-delete.js', () => {
  it('should permanently delete a health record from the repo and DB, given a health record with a soft deleted date equal to 8 weeks', async () => {
    // given
    const date = moment().subtract(8, 'weeks').toISOString();

    const healthRecord = getHealthRecords(date, date, date, date, false);

    const { conversationId } = healthRecord[0];

    // when
    permanentlyDeleteEhrFromRepoAndDb.mockResolvedValueOnce(undefined);
    await checkDateAndDelete(healthRecord);

    // then
    expect(permanentlyDeleteEhrFromRepoAndDb).toBeCalledTimes(1);
    expect(logInfo).toBeCalledTimes(3);
    expect(logInfo).toBeCalledWith(
      `${loggerPrefix} Identifying health records with a soft deletion date greater than or equal to 8 weeks.`
    );
    expect(logInfo).toBeCalledWith(
      `${loggerPrefix} Record found with Conversation ID: ${conversationId}, deleting...`
    );
    expect(logInfo).toBeCalledWith(`${loggerPrefix} Summary: 0 skipped, 1 deleted.`);
  });

  it('should permanently delete a health record from the repo and DB, given multiple health records with a soft deleted date equal to 8 weeks and 1 day', async () => {
    // given
    const date = moment().subtract(8, 'weeks').subtract(1, 'days').toISOString();

    const healthRecords = getHealthRecords(date, date, date, date, true);

    // when
    permanentlyDeleteEhrFromRepoAndDb.mockResolvedValueOnce(undefined);
    await checkDateAndDelete(healthRecords);

    // then
    expect(permanentlyDeleteEhrFromRepoAndDb).toBeCalledTimes(5);
    expect(logInfo).toBeCalledTimes(7);
    expect(logInfo).toBeCalledWith(`${loggerPrefix} Summary: 0 skipped, 5 deleted.`);
  });

  it('should not delete a health record, given a health record with a soft deleted date equal to 7 weeks and 6 days', async () => {
    // given
    const date = moment().subtract(7, 'weeks').subtract(6, 'days').toISOString();

    const healthRecord = getHealthRecords(date, date, date, date, false);

    // when
    await checkDateAndDelete(healthRecord);

    // then
    expect(logInfo).toBeCalledTimes(2);
    expect(logInfo).toBeCalledWith(
      `${loggerPrefix} Identifying health records with a soft deletion date greater than or equal to 8 weeks.`
    );
    expect(logInfo).toBeCalledWith(`${loggerPrefix} Summary: 1 skipped, 0 deleted.`);
  });
});
