import {body} from "express-validator";

const EHR_EXTRACT_MESSAGE_TYPE = 'ehrExtract';
const ATTACHMENT_MESSAGE_TYPE = 'attachment';

export const storeMessageControllerValidation = [
  body('data.type').equals('messages'),
  body('data.id').isUUID().withMessage("'id' provided is not a UUID"),
  body('data.attributes.conversationId')
    .isUUID()
    .withMessage("'conversationId' provided is not a UUID"),
  body('data.attributes.nhsNumber')
    .if(body('data.attributes.messageType').equals(EHR_EXTRACT_MESSAGE_TYPE))
    .notEmpty()
    .withMessage(`'nhsNumber' is required for messageType ${EHR_EXTRACT_MESSAGE_TYPE}`)
    .isNumeric().withMessage("'nhsNumber' provided is not numeric")
    .isLength({min: 10, max: 10})
    .withMessage("'nhsNumber' provided is not 10 characters"),
  body('data.attributes.nhsNumber')
    .if(body('data.attributes.messageType').equals(ATTACHMENT_MESSAGE_TYPE))
    .isEmpty()
    .withMessage(`'nhsNumber' should be empty for messageType ${ATTACHMENT_MESSAGE_TYPE}`),
  body('data.attributes.messageType')
    .isIn([EHR_EXTRACT_MESSAGE_TYPE, ATTACHMENT_MESSAGE_TYPE])
    .withMessage(`'messageType' provided is not one of the following: ${EHR_EXTRACT_MESSAGE_TYPE}, ${ATTACHMENT_MESSAGE_TYPE}`),
  body('data.attributes.attachmentMessageIds.*').isUUID().withMessage("'attachmentMessageIds' should be UUIDs"),
  body('data.attributes.attachmentMessageIds').optional().isArray().withMessage("'attachmentMessageIds' should be an array")
]

export const storeMessageController = (req, res) => {
  res.sendStatus(201);
};