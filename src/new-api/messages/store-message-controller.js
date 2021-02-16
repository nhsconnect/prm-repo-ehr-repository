import { body } from 'express-validator';
import { MessageType } from '../../models/message';
import { createMessage } from '../../services/database/message-repository';

export const storeMessageControllerValidation = [
  body('data.type').equals('messages'),
  body('data.id')
    .isUUID()
    .withMessage("'id' provided is not a UUID"),
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
    .optional()
    .isArray()
    .withMessage("'attachmentMessageIds' should be an array")
];

export const storeMessageController = async (req, res) => {
  const message = {
    messageId: req.body.data.id,
    conversationId: req.body.data.attributes.conversationId,
    type: req.body.data.attributes.messageType
  };
  await createMessage(message);
  res.sendStatus(201);
};
