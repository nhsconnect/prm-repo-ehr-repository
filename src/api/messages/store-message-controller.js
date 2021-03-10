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
} from '../../services/database/health-record-repository';

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

  try {
    if (attributes.messageType === MessageType.EHR_EXTRACT) {
      if (await healthRecordExists(attributes.conversationId)) {
        logWarning(`Duplicated ehrExtract message ${id}`);
        res.sendStatus(409);
        return;
      }
      await createEhrExtract({
        messageId: id,
        conversationId: attributes.conversationId,
        nhsNumber: attributes.nhsNumber,
        attachmentMessageIds: attributes.attachmentMessageIds,
      });
    }
    if (attributes.messageType === MessageType.ATTACHMENT) {
      if (await attachmentExists(id)) {
        await updateAttachmentAndCreateItsParts(
          id,
          attributes.conversationId,
          attributes.attachmentMessageIds
        );
      } else {
        logWarning(
          `Attachment message ${id} did not arrive in order. Attachment parts: ${JSON.stringify(
            attributes.attachmentMessageIds
          )}`
        );
        await createAttachmentPart(id, attributes.conversationId);
      }
    }
    await updateHealthRecordCompleteness(attributes.conversationId);
    res.sendStatus(201);
  } catch (e) {
    logError('Returned 503 due to error while saving message', e);
    res.sendStatus(503);
  }
};
