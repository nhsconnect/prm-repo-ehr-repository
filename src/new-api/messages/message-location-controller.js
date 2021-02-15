import { getSignedUrl } from '../../services/storage';
import { param } from 'express-validator';
import { logError, logEvent } from '../../middleware/logging';

export const messageLocationControllerValidation = [
  param('conversationId')
    .isUUID()
    .withMessage("'conversationId' provided is not a UUID"),
  param('messageId')
    .isUUID()
    .withMessage("'messageId' provided is not a UUID")
];

export const messageLocationController = async (req, res) => {
  const { conversationId, messageId } = req.params;
  const operation = 'putObject';

  try {
    const presignedUrl = await getSignedUrl(conversationId, messageId, operation);
    res
      .status(302)
      .location(presignedUrl)
      .send();
    logEvent('Presigned URL sent successfully');
  } catch (err) {
    logError('Failed to retrieve pre-signed url', err);
    res.sendStatus(500);
  }
};
