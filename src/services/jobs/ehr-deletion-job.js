import {
  hardDeleteHealthRecordByConversationId,
  findAllSoftDeletedHealthRecords,
} from '../database/health-record-repository';
import { gracefulShutdown, scheduleJob } from 'node-schedule';
import { logError, logInfo } from '../../middleware/logging';
import { S3Service } from '../storage';
import { getNow } from '../time';
import moment from 'moment';
import { hardDeleteAllMessagesByConversationId } from '../database/message-repository';

const loggerPrefix = '[SCHEDULED JOB] [EHR S3 DELETIONS] -';

export const ehrDeletionJob = scheduleJob('00 00 03 * * *', async () => {
  logInfo(
    `${loggerPrefix} Deleting EHRs with soft deletion date equal to 8 weeks as of ${getNow()}.`
  );

  try {
    const records = await findAllSoftDeletedHealthRecords();

    if (records.length > 0) {
      await checkDateAndDelete(records);
    } else {
      logInfo(`${loggerPrefix} No health records are marked for deletion, shutting down.`);
      await gracefulShutdown();
    }
  } catch (error) {
    logError(`${loggerPrefix} An error occurred - detail: ${error}, shutting down.`);
    await gracefulShutdown();
  }
});

const checkDateAndDelete = async (healthRecords) => {
  for (const healthRecord of healthRecords) {
    const today = moment();
    const softDeletedDate = moment(healthRecord.deletedAt);

    if (softDeletedDate.add(8, 'weeks').isSameOrBefore(today)) {
      await permanentlyDeleteEhrFromRepoAndDb(healthRecord);
    }
  }
};

const permanentlyDeleteEhrFromRepoAndDb = async (healthRecord) => {
  const { conversationId } = healthRecord;
  const s3 = new S3Service(`${conversationId}`);

  try {
    // Delete the object from the S3 bucket.
    await s3.delete();

    // Delete messages and health record within this database.
    await hardDeleteAllMessagesByConversationId(conversationId);
    await hardDeleteHealthRecordByConversationId(conversationId);

    logInfo(
      `${loggerPrefix} Successfully deleted EHR with Conversation ID ${healthRecord.conversationId} from S3, and associated records in the database.`
    );
  } catch (error) {
    logError(
      `${loggerPrefix} Failed to delete object with conversation ID ${healthRecord.conversationId} - ${error}`
    );
    await ehrDeletionJob.gracefulShutdown();
  }
};
