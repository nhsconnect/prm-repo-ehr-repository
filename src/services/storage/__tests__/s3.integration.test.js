import S3Service from "../s3";
import { v4 as uuidv4 } from 'uuid';
import { logInfo } from "../../../middleware/logging";

jest.mock("../../../middleware/logging");

describe('S3Service integration test with localstack', () => {
  it('can see the default test-bucket in localstack', async () => {
    // given
    const client = new S3Service('');

    // when
    const response = await client.s3.listBuckets().promise();

    // then
    expect(response.Buckets).toContainEqual({
      Name: 'test-bucket',
      CreationDate: expect.anything()
    })
  })

  it('can save an object in test bucket', async () => {
    // given
    const testFileName = uuidv4() + '/' + uuidv4();
    const testData = 'Lorem ipsum dolor sit amet';

    // when
    const client = new S3Service(testFileName);
    await client.save(testData)

    // then
    const objectInBucket = await client.s3.getObject({
        Bucket: client.parameters.Bucket,
        Key: testFileName,
    }).promise();
    const objectBody = objectInBucket.Body.toString('utf8');

    expect(objectBody).toEqual(testData)
  })

  it('can delete objects in test bucket', async () => {
    // given
    const conversationId = uuidv4();
    const testFileNames = Array(3).fill('').map(() => conversationId + '/' + uuidv4());

    for (let filename of testFileNames) {
      const objectClient = new S3Service(filename);
      await objectClient.save('some data');
    }

    // when
    const deleteBucketClient = new S3Service(conversationId);
    await deleteBucketClient.deleteObject()

    //then
    expect(logInfo).toBeCalledWith('Successfully deleted objects from S3 bucket:');

    const deletedFilesInLog = JSON.stringify(logInfo.mock.lastCall[0]);
    testFileNames.forEach(filename => {
      expect(deletedFilesInLog).toContain(filename);
    })
  })
})