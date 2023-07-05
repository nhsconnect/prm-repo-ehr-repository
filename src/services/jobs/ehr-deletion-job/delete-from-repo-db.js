import { deleteHealthRecordAndMessages } from '../../database/delete-health-record';
import { setCurrentSpanAttributes } from '../../../config/tracing';
import { logError, logInfo } from '../../../middleware/logging';
import { loggerPrefix } from './ehr-deletion-job-common';

export const permanentlyDeleteEhrFromRepoAndDb = async (healthRecord) => {
  const { conversationId } = healthRecord;

  setCurrentSpanAttributes({ conversationId });

  try {
    await deleteHealthRecordAndMessages(conversationId);

    logInfo(
      `${loggerPrefix} Successfully deleted health record with Conversation ID ${healthRecord.conversationId} from S3, and associated records within the database.`
    );
  } catch (error) {
    logError(
      `${loggerPrefix} Failed to delete health record with conversation ID ${healthRecord.conversationId}.`,
      error
    );
  }
};
