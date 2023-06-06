import { body } from 'express-validator';
import { MessageType } from '../../models/message';
import {
  updateFragmentAndCreateItsParts,
  createEhrExtract,
  fragmentExists,
  createFragmentPart,
} from '../../services/database/message-repository';
import { logError, logInfo, logWarning } from '../../middleware/logging';
import {
  updateHealthRecordCompleteness,
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
    .if(body('data.attributes.messageType').equals(MessageType.FRAGMENT))
    .isEmpty()
    .withMessage(`'nhsNumber' should be empty for messageType ${MessageType.FRAGMENT}`),
  body('data.attributes.messageType')
    .isIn([MessageType.EHR_EXTRACT, MessageType.FRAGMENT])
    .withMessage(
      `'messageType' provided is not one of the following: ${MessageType.EHR_EXTRACT}, ${MessageType.FRAGMENT}`
    ),
  body('data.attributes.fragmentMessageIds.*')
    .isUUID()
    .withMessage("'fragmentMessageIds' should be UUIDs"),
  body('data.attributes.fragmentMessageIds')
    .isArray()
    .withMessage("'fragmentMessageIds' should be an array"),
];

export const storeMessageController = async (req, res) => {
  const { id, attributes } = req.body.data;
  const { conversationId, messageType, nhsNumber, fragmentMessageIds } = attributes;
  setCurrentSpanAttributes({ conversationId, messageId: id });

  try {
    if (messageType === MessageType.EHR_EXTRACT) {
      await createEhrExtract({
        messageId: id,
        conversationId,
        nhsNumber,
        fragmentMessageIds,
      });
    }
    if (messageType === MessageType.FRAGMENT) {
      if (await fragmentExists(id)) {
        await updateFragmentAndCreateItsParts(id, conversationId, fragmentMessageIds);
      } else {
        logWarning(
          `Fragment message ${id} did not arrive in order. Fragment parts: ${JSON.stringify(
            fragmentMessageIds
          )}`
        );
        await createFragmentPart(id, conversationId);
      }
    }
    await updateHealthRecordCompleteness(conversationId);
    const healthRecordStatus = await getHealthRecordStatus(conversationId);

    logInfo('Health record status for fragments: ' + healthRecordStatus);
    res.status(201).json({ healthRecordStatus });
  } catch (e) {
    logError('Returned 503 due to error while saving message', e);
    res.sendStatus(503);
  }
};
