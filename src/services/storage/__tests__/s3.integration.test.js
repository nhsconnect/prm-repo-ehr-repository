import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

import S3Service from '../s3';
import { logInfo } from '../../../middleware/logging';
import { generateMultipleUUID } from '../../../utilities/integration-test-utilities';
import { InvalidArgumentError, NoS3ObjectsFoundError } from '../../../errors/errors';
import getSignedUrl from '../get-signed-url';

jest.mock('../../../middleware/logging');

describe('S3Service integration test with localstack', () => {
  const S3CLIENT = new S3Service();

  // ===== HELPER METHODS =====
  const extractFilenames = (arrayOfObjects) => arrayOfObjects.map((object) => object.Key);
  const clearS3Bucket = async () => {
    const allObjects = await S3CLIENT.listObjects();
    if (allObjects.length === 0) return;

    const deleteObjectParams = S3CLIENT.buildDeleteParamsFromObjects(allObjects);
    await S3CLIENT.s3.deleteObjects(deleteObjectParams).promise();
  };
  const getObjectByName = (filename) => {
    const getObjectParams = {
      Bucket: S3CLIENT.Bucket,
      Key: filename,
    };
    return S3CLIENT.s3.getObject(getObjectParams).promise();
  };

  beforeEach(async () => {
    await clearS3Bucket();
  });

  // ===== TESTS START FROM HERE =====
  it('can access the default test-bucket in localstack', async () => {
    // when
    const response = await S3CLIENT.checkS3Health();

    // then
    expect(response).toEqual({
      available: true,
      bucketName: 'test-bucket',
      type: 's3',
      writable: true,
    });
  });

  describe('saveObjectWithName', () => {
    it('can save an object in the S3 bucket', async () => {
      // given
      const testFileName = uuidv4() + '/' + uuidv4();
      const testData = 'Lorem ipsum dolor sit amet';

      // when
      await S3CLIENT.saveObjectWithName(testFileName, testData);

      // then
      const objectInBucket = await getObjectByName(testFileName);
      const objectContent = objectInBucket.Body.toString();

      expect(objectContent).toEqual(testData);
    });
  });

  describe('listObjects', () => {
    it('can list all objects in the S3 bucket', async () => {
      // given
      const testFileNames = generateMultipleUUID(5);
      for (let filename of testFileNames) {
        await S3CLIENT.saveObjectWithName(filename, 'test file');
      }

      // when
      const response = await S3CLIENT.listObjects();
      const filenamesInResponse = response.map((object) => object.Key);

      // then
      expect(filenamesInResponse.sort()).toEqual(testFileNames.sort());
    });
  });

  describe('deleteObjectsByPrefix', () => {
    it('delete all objects of filename starting with the given prefix', async () => {
      // given
      const conversationIdToDelete = uuidv4();
      const filesToDelete = generateMultipleUUID(3).map(
        (messageId) => conversationIdToDelete + '/' + messageId
      );
      const anotherConversationId = uuidv4();
      const filesToKeep = generateMultipleUUID(3).map(
        (messageId) => anotherConversationId + '/' + messageId
      );

      for (let filename of [...filesToDelete, ...filesToKeep]) {
        await S3CLIENT.saveObjectWithName(filename, 'some data');
      }

      // when
      await S3CLIENT.deleteObjectsByPrefix(conversationIdToDelete);

      // then
      expect(logInfo).toBeCalledWith('Successfully deleted objects from S3 bucket:');

      // verify that files start with conversationIdToDelete are deleted
      const filesRemainInBucket = await S3CLIENT.listObjects().then(extractFilenames);
      filesToDelete.forEach((deletedFile) => {
        expect(filesRemainInBucket).not.toContain(deletedFile);
      });

      // verify that files not start with conversationIdToDelete are still there
      expect(filesRemainInBucket).toEqual(expect.arrayContaining(filesToKeep));
    });

    it('should throw InvalidArgumentError if the given prefix is an empty string', async () => {
      // when
      await expect(S3CLIENT.deleteObjectsByPrefix(''))
        // then
        .rejects.toThrow(InvalidArgumentError);
    });

    it('throws NoS3ObjectsFoundError if no objects match the given prefix', async () => {
      // when
      await expect(S3CLIENT.deleteObjectsByPrefix('non-exist-filename'))
        // then
        .rejects.toThrow(NoS3ObjectsFoundError);
    });
  });

  describe('getSignedUrl', () => {
    it('return a presigned url for upload when operation = putObject', async () => {
      // given
      const [conversationId, messageId] = generateMultipleUUID(2);
      const testFileName = `${conversationId}/${messageId}`;
      const operation = 'putObject';
      const testEhrCore = {
        ebXML: '<soap:Envelope><content>soup envelope</content></soap:Envelope>',
        payload: '<RCMR_IN030000UK06>payload</<RCMR_IN030000UK06>',
        attachments: [],
        external_attachments: [],
      };

      // when
      const presignedUrl = await getSignedUrl(conversationId, messageId, operation);
      const response = await axios.put(presignedUrl, testEhrCore);

      // then
      expect(response.status).toBe(200);

      // verify that the uploaded file is in the test bucket
      const bucketFilenames = await S3CLIENT.listObjects().then(extractFilenames);
      expect(bucketFilenames).toContain(testFileName);

      const objectInBucket = await getObjectByName(testFileName);
      const objectContent = objectInBucket.Body.toString();

      expect(objectContent).toEqual(JSON.stringify(testEhrCore));
    });

    it('return a presigned url for download when operation = getObject', async () => {
      // given
      const [conversationId, messageId] = generateMultipleUUID(2);
      const testFileName = `${conversationId}/${messageId}`;
      const operation = 'getObject';

      const testEhrCore = {
        ebXML: '<soap:Envelope><content>soup envelope</content></soap:Envelope>',
        payload: '<RCMR_IN030000UK06>payload</<RCMR_IN030000UK06>',
        attachments: [],
        external_attachments: [],
      };
      await S3CLIENT.saveObjectWithName(testFileName, JSON.stringify(testEhrCore));

      // when
      const presignedUrl = await getSignedUrl(conversationId, messageId, operation);
      const response = await axios.get(presignedUrl);

      // then
      expect(response.status).toBe(200);

      // verify that the file we download from presignedUrl is same as the file we stored in bucket
      expect(response.data).toEqual(testEhrCore);
    });
  });
});
