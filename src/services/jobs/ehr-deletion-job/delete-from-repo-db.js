import { S3Service } from '../../storage';
import { hardDeleteAllMessagesByConversationId } from '../../database/message-repository';
import { hardDeleteHealthRecordByConversationId } from '../../database/health-record-repository';
import { logError, logInfo } from '../../../middleware/logging';
import { loggerPrefix } from './ehr-deletion-job-utilities';

export const permanentlyDeleteEhrFromRepoAndDb = async (healthRecord) => {
  const { conversationId } = healthRecord;

  try {
    const s3 = new S3Service(conversationId);
    await s3.deleteObject();

    await hardDeleteAllMessagesByConversationId(conversationId);
    await hardDeleteHealthRecordByConversationId(conversationId);

    logInfo(
      `${loggerPrefix} Successfully deleted health record with Conversation ID ${healthRecord.conversationId} from S3, and associated records within the database.`
    );
  } catch (error) {
    logError(
      `${loggerPrefix} Failed to delete health record with conversation ID ${healthRecord.conversationId}, more details: - ${error}`
    );
  }
};
