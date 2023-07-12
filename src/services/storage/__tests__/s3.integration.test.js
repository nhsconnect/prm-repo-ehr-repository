import S3Service from '../s3';
import { v4 as uuidv4 } from 'uuid';
import { logInfo } from '../../../middleware/logging';
import { generateMultipleUUID } from '../../../utilities/integration-test-utilities';
import { InvalidArgumentError, NoS3ObjectsFoundError } from '../../../errors/errors';

jest.mock('../../../middleware/logging');

describe('S3Service integration test with localstack', () => {
  const S3CLIENT = new S3Service();

  const extractFilenames = (arrayOfObjects) => arrayOfObjects.map((object) => object.Key);
  const clearS3Bucket = async () => {
    const allObjects = await S3CLIENT.listObjects();
    if (allObjects.length === 0) return;

    const deleteObjectParams = S3CLIENT.buildDeleteParamsFromObjects(allObjects);
    await S3CLIENT.s3.deleteObjects(deleteObjectParams).promise();
  };

  beforeEach(async () => {
    await clearS3Bucket();
  });

  it('can see the default test-bucket in localstack', async () => {
    // given
    const client = new S3Service('test-health-check');

    // when
    const response = await client.checkS3Health();

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
      const objectInBucket = await S3CLIENT.s3
        .getObject({
          Bucket: S3CLIENT.Bucket,
          Key: testFileName,
        })
        .promise();
      const objectBody = objectInBucket.Body.toString();

      expect(objectBody).toEqual(testData);
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

      // verify that the files start with conversationIdToDelete are deleted, and other files are still there
      const filesRemainInBucket = await S3CLIENT.listObjects().then(extractFilenames);
      filesToDelete.forEach((deletedFile) => {
        expect(filesRemainInBucket).not.toContain(deletedFile);
      });
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
});
