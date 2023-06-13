import {
  deleteHealthRecord,
  findAllDeletedHealthRecords,
  getHealthRecordMessageIds,
} from '../database/health-record-repository';
import { gracefulShutdown, scheduleJob } from 'node-schedule';
import { logError, logInfo } from '../../middleware/logging';
import { S3Service } from '../storage';
import { getNow } from '../time';
import moment from 'moment';
import { deleteMessages } from '../database/message-repository';

const loggerPrefix = '[SCHEDULED JOB] [EHR S3 DELETIONS] -';

// TODO PRMT-3415 MOVE CRON SCHEDULE STRING TO PARAMETER STORE
const ehrDeletionJob = scheduleJob('00 00 03 * * *', async () => {
  logInfo(
    `${loggerPrefix} Deleting EHRs with soft deletion date equal to 8 weeks as of ${getNow()}.`
  );

  try {
    const records = await findAllDeletedHealthRecords();

    if (records.length > 0) await compareAndDelete(records);
    else await gracefulShutdown();
  } catch (error) {
    logError(`${loggerPrefix} An error occurred, ${error} - shutting down.`);
    await gracefulShutdown();
  }
});

const compareAndDelete = async (healthRecords) => {
  for (const healthRecord of healthRecords) {
    const today = moment();
    const softDeleteDate = healthRecord.deletedAt;

    if (moment(softDeleteDate).add(8, 'weeks').isSameOrBefore(today)) {
      await permanentlyDeleteEhrFromRepoAndDb(healthRecord);
    }
  }
};

const permanentlyDeleteEhrFromRepoAndDb = async (healthRecord) => {
  const s3 = new S3Service(`${healthRecord.conversationId}`);

  try {
    // Delete the object from the S3 bucket.
    await s3.delete();

    // Delete messages and health record within this database.
    await deleteHealthRecord(healthRecord.conversationId);
    await deleteMessages([...(await getHealthRecordMessageIds(healthRecord.conversationId))]);

    logInfo(
      `${loggerPrefix} Successfully deleted EHR with Conversation ID ${healthRecord.conversationId} from S3.`
    );
  } catch (error) {
    logError(
      `${loggerPrefix} Failed to delete object with conversation ID ${healthRecord.conversationId} - ${error}`
    );
    await ehrDeletionJob.gracefulShutdown();
  }
};
