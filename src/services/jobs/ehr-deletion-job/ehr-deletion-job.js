import { findAllSoftDeletedHealthRecords } from '../../database/health-record-repository';
import { loggerPrefix } from './ehr-deletion-job-common';
import { checkDateAndDelete } from './check-date-delete';
import { logInfo } from '../../../middleware/logging';
import cron from 'node-cron';

export const ehrDeletionJob = cron.schedule(
  '*/15 * * * *', // TODO: PRMT-4126, REVERT BACK TO 3AM.
  async () => {
    logInfo(`${loggerPrefix} Job triggered, preparing to delete health records.`);

    const records = await findAllSoftDeletedHealthRecords();

    if (records.length > 0) {
      await checkDateAndDelete(records);
    } else {
      logInfo(`${loggerPrefix} Could not find any health records that are marked for deletion.`);
    }
  }
  // { scheduled: false }
);
