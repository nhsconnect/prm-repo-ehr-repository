import { body } from 'express-validator';
import { MessageType } from '../../models/message';
import {
  updateAttachmentAndCreateItsParts,
  createEhrExtract,
  attachmentExists,
  createAttachmentPart,
} from '../../services/database/message-repository';
import { logError, logWarning } from '../../middleware/logging';
import {
  updateHealthRecordCompleteness,
  healthRecordExists,
  getHealthRecordStatus,
} from '../../services/database/health-record-repository';
import { setCurrentSpanAttributes } from '../../config/tracing';

export const storeMessageControllerValidation = [
  body('data.type').equals('messages'),
  body('data.id').isUUID().withMessage("'id' provided is not a UUID"),
  body('data.attributes.conversationId')
    .isUUID()
    .withMessage("'conversationId' provided is not a UUID"),
  body('data.attributes.nhsNumber')
    .if(body('data.attributes.messageType').equals(MessageType.EHR_EXTRACT))
    .notEmpty()
    .withMessage(`'nhsNumber' is required for messageType ${MessageType.EHR_EXTRACT}`)
    .isNumeric()
    .withMessage("'nhsNumber' provided is not numeric")
    .isLength({ min: 10, max: 10 })
    .withMessage("'nhsNumber' provided is not 10 characters"),
  body('data.attributes.nhsNumber')
    .if(body('data.attributes.messageType').equals(MessageType.ATTACHMENT))
    .isEmpty()
    .withMessage(`'nhsNumber' should be empty for messageType ${MessageType.ATTACHMENT}`),
  body('data.attributes.messageType')
    .isIn([MessageType.EHR_EXTRACT, MessageType.ATTACHMENT])
    .withMessage(
      `'messageType' provided is not one of the following: ${MessageType.EHR_EXTRACT}, ${MessageType.ATTACHMENT}`
    ),
  body('data.attributes.attachmentMessageIds.*')
    .isUUID()
    .withMessage("'attachmentMessageIds' should be UUIDs"),
  body('data.attributes.attachmentMessageIds')
    .isArray()
    .withMessage("'attachmentMessageIds' should be an array"),
];

export const storeMessageController = async (req, res) => {
  const { id, attributes } = req.body.data;
  const { conversationId, messageType, nhsNumber, attachmentMessageIds } = attributes;
  setCurrentSpanAttributes({ conversationId, messageId: id });

  try {
    if (messageType === MessageType.EHR_EXTRACT) {
      if (await healthRecordExists(conversationId)) {
        logWarning(`Duplicated ehrExtract message ${id}`);
        res.sendStatus(409);
        return;
      }
      await createEhrExtract({
        messageId: id,
        conversationId,
        nhsNumber,
        attachmentMessageIds,
      });
    }
    if (messageType === MessageType.ATTACHMENT) {
      if (await attachmentExists(id)) {
        await updateAttachmentAndCreateItsParts(id, conversationId, attachmentMessageIds);
      } else {
        logWarning(
          `Attachment message ${id} did not arrive in order. Attachment parts: ${JSON.stringify(
            attachmentMessageIds
          )}`
        );
        await createAttachmentPart(id, conversationId);
      }
    }
    await updateHealthRecordCompleteness(conversationId);
    const healthRecordStatus = await getHealthRecordStatus(conversationId);

    res.status(201).json({ healthRecordStatus });
  } catch (e) {
    logError('Returned 503 due to error while saving message', e);
    res.sendStatus(503);
  }
};
