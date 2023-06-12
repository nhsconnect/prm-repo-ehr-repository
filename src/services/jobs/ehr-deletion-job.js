import { gracefulShutdown, scheduleJob } from 'node-schedule';
import { logError, logInfo } from '../../middleware/logging';
import { getNow } from '../time';
import { findAllDeletedMessages } from '../database/message-repository';
import moment from 'moment';
import { S3Service } from '../storage';

const loggerPrefix = '[SCHEDULED JOB] -';

/**
 * This function executes every day at 3:00AM which will fetch all the
 * records marked as deleted. If the deletedAt field is 8 weeks at the
 * time this job runs, it will be permanently deleted.
 * @type {*}
 */
const ehrDeletionJob = scheduleJob('00 00 03 *', async () => {
  logInfo(
    `${loggerPrefix} Deleting EHRs with soft deletion date equal to 8 weeks as of ${getNow()}.`
  );

  try {
    const records = await findAllDeletedMessages();

    if (records.length > 0) await compareAndDelete(records);
    else await gracefulShutdown();
  } catch (error) {
    logError(`${loggerPrefix} An error occurred, ${error} - shutting down.`);
    await gracefulShutdown();
  }
});

const compareAndDelete = async (messages) => {
  for (const message of messages) {
    const today = moment();
    const softDeleteDate = message.deletedAt;

    if (moment(softDeleteDate).add(8, 'weeks').isSameOrBefore(today)) {
      await permanentlyDeleteEhrFromRepo(message);
    }
  }
};

const permanentlyDeleteEhrFromRepo = async (message) => {
  logInfo(
    `${loggerPrefix} Successfully deleted EHR with Conversation ID ${message.conversationId} from S3.`
  );

  const s3 = new S3Service(`${message.conversationId}`);

  try {
    await s3.delete();
  } catch (error) {
    logError(
      `${loggerPrefix} Failed to delete object with conversation ID ${message.conversationId} - ${error}`
    );
    ehrDeletionJob.gracefulShutdown();
  }
};
