import { param } from 'express-validator';
import {
  getCurrentHealthRecordIdForPatient,
  getHealthRecordMessageIds,
} from '../../services/database/health-record-repository';
import { logError, logInfo } from '../../middleware/logging';
import getSignedUrl from '../../services/storage/get-signed-url';
import { setCurrentSpanAttributes } from '../../config/tracing';

export const patientDetailsValidation = [
  param('nhsNumber')
    .isNumeric()
    .withMessage("'nhsNumber' provided is not numeric")
    .isLength({ min: 10, max: 10 })
    .withMessage("'nhsNumber' provided is not 10 characters"),
];

export const patientDetailsController = async (req, res) => {
  const { nhsNumber } = req.params;
  const conversationId = req.get('conversationId');
  if (!conversationId) {
    logError('conversationId not passed as header');
    res.sendStatus(400);
    return;
  }
  const getOperation = 'getObject';
  try {
    logInfo('Putting conversation ID into log context', conversationId);
    setCurrentSpanAttributes({ conversationId: conversationId });
    const currentHealthRecordConversationId = await getCurrentHealthRecordIdForPatient(nhsNumber);
    if (!currentHealthRecordConversationId) {
      logInfo('Did not find a complete patient health record');
      res.sendStatus(404);
      return;
    }

    logInfo('Getting fragment message ids');
    const { coreMessageId, fragmentMessageIds } = await getHealthRecordMessageIds(
      currentHealthRecordConversationId
    );

    const coreMessageUrl = await getSignedUrl(
      currentHealthRecordConversationId,
      coreMessageId,
      getOperation
    );

    const responseBody = {
      coreMessageUrl,
      fragmentMessageIds,
      conversationIdFromEhrIn: currentHealthRecordConversationId,
    };

    res.status(200).json(responseBody);
  } catch (err) {
    logError('Could not retrieve patient health record', err);
    res.sendStatus(503);
  }
};
