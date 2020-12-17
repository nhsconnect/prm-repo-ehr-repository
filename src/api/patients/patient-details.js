import { param } from 'express-validator';
import { getCurrentHealthRecordForPatient } from '../../services/database';
import { logError, logEvent } from '../../middleware/logging';
import getSignedUrl from '../../services/storage/get-signed-url';
import { getMessageFragmentByHealthRecordId } from '../../services/database';

export const patientDetailsValidation = [
  param('nhsNumber')
    .optional()
    .isNumeric()
    .withMessage("'nhsNumber' provided is not numeric"),
  param('nhsNumber')
    .optional()
    .isLength({ min: 10, max: 10 })
    .withMessage("'nhsNumber' provided is not 10 characters")
];

export const patientDetails = async (req, res) => {
  try {
    const healthRecord = await getCurrentHealthRecordForPatient(req.params.nhsNumber);
    if (healthRecord === null) {
      res.sendStatus(404);
      return;
    }
    const { id, conversation_id: conversationId } = healthRecord.dataValues;
    const messageFragment = await getMessageFragmentByHealthRecordId(id);
    if (messageFragment === null) {
      res.sendStatus(404);
      return;
    }
    const { message_id: messageId } = messageFragment.dataValues;
    logEvent('requesting signed url for:', { conversationId, messageId });
    const getOperation = 'getObject';
    const presignedUrl = await getSignedUrl(conversationId, messageId, getOperation);

    const responseBody = {
      data: {
        id: req.params.nhsNumber,
        type: 'patients',
        links: {
          currentEhr: presignedUrl
        }
      }
    };
    res.status(200).json(responseBody);
  } catch (err) {
    logError('Error retrieving patient health record', err);
    res.status(500).send({ error: err.message });
  }
};
