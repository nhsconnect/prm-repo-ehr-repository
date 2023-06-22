import { hardDeleteAllMessagesByConversationId } from '../database/message-repository';
import { logError, logInfo } from '../../middleware/logging';
import {
  hardDeleteHealthRecordByConversationId,
  findAllSoftDeletedHealthRecords,
} from '../database/health-record-repository';
import { S3Service } from '../storage';
import { getNow } from '../time';
import cron from 'node-cron';
import moment from 'moment';

const loggerPrefix = `[SCHEDULED JOB] [EHR S3 DELETIONS] -`;

export const ehrDeletionJob = cron.schedule('00 03 * * *', async () => {
  logInfo(
    `${loggerPrefix} Deleting health records with a soft deletion date equal to 8 weeks as of ${getNow()}.`
  );

  try {
    const records = await findAllSoftDeletedHealthRecords();

    if (records.length > 0) {
      await checkDateAndDelete(records);
    } else {
      logInfo(`${loggerPrefix} No health records are marked for deletion.`);
    }
  } catch (error) {
    logError(`${loggerPrefix} An error occurred - detail: ${error}.`);
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

    // Delete messages and health record within the ehr-out database.
    await hardDeleteAllMessagesByConversationId(conversationId);
    await hardDeleteHealthRecordByConversationId(conversationId);

    logInfo(
      `${loggerPrefix} Successfully deleted health record with Conversation ID ${healthRecord.conversationId} from S3, and associated records within the database.`
    );
  } catch (error) {
    logError(
      `${loggerPrefix} Failed to delete object with conversation ID ${healthRecord.conversationId} - ${error}`
    );
    await ehrDeletionJob.stop();
  }
};
