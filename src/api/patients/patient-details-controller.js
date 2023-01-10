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

  //only for testing purposes
  const FAILING_NHS_NUMBER = '9691234567';
  if (nhsNumber === FAILING_NHS_NUMBER) {
    logError('Using NHS number that causes deliberate failure');
    res.sendStatus(503);
    return;
  }

  const getOperation = 'getObject';

  try {
    const currentHealthRecordId = await getCurrentHealthRecordIdForPatient(nhsNumber);
    if (!currentHealthRecordId) {
      logInfo('Did not find a complete patient health record');
      res.sendStatus(404);
      return;
    }
    logInfo('Putting conversation ID into log context');
    setCurrentSpanAttributes({ conversationId: currentHealthRecordId });
    logInfo('Getting fragment message ids');
    const { healthRecordExtractId, fragmentMessageIds } = await getHealthRecordMessageIds(
      currentHealthRecordId
    );

    const healthRecordExtractUrl = await getSignedUrl(
      currentHealthRecordId,
      healthRecordExtractId,
      getOperation
    );

    //TODO: do we need this anymore??
    let fragmentMessageUrls = [];
    for (const index in fragmentMessageIds) {
      const url = await getSignedUrl(
        currentHealthRecordId,
        fragmentMessageIds[index],
        getOperation
      );
      fragmentMessageUrls.push(url);
    }

    const responseBody = {
      data: {
        type: 'patients',
        id: nhsNumber,
        links: {
          healthRecordExtract: healthRecordExtractUrl,
          //TODO: RENAME & code change
          attachments: fragmentMessageUrls,
        },
      },
    };

    res.status(200).json(responseBody);
  } catch (err) {
    logError('Could not retrieve patient health record', err);
    res.sendStatus(503);
  }
};
