import { permanentlyDeleteEhrFromRepoAndDb } from './delete-from-repo-db';
import { loggerPrefix } from './ehr-deletion-job-common';
import { logInfo } from '../../../middleware/logging';
import moment from 'moment/moment';

export const checkDateAndDelete = async (healthRecords) => {
  logInfo(
    `${loggerPrefix} Identifying health records with a soft deletion date greater than or equal to 8 weeks.`
  );

  let skipped = 0;
  let deleted = 0;

  for (const healthRecord of healthRecords) {
    const today = moment();
    const softDeletedDate = moment(healthRecord.deletedAt);

    if (softDeletedDate.add(8, 'weeks').isSameOrBefore(today)) {
      logInfo(
        `${loggerPrefix} Record found with Conversation ID: ${healthRecord.conversationId}, deleting...`
      );

      deleted++;
      await permanentlyDeleteEhrFromRepoAndDb(healthRecord);
    } else skipped++;
  }

  if (skipped === healthRecords.length) logInfo(`${loggerPrefix} No health records were deleted.`);
  else logInfo(`${loggerPrefix} ${skipped} health records skipped, ${deleted} deleted.`);
};
