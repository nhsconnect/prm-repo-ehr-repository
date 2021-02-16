import { v4 as uuid } from 'uuid';
import { createMessage } from '../message-repository';
import ModelFactory from '../../../models';
import { modelName } from '../../../models/message';
import { logError } from '../../../middleware/logging';

jest.mock('../../../middleware/logging');

describe('messageRepository', () => {
  const Message = ModelFactory.getByName(modelName);
  const type = 'ehrExtract';

  afterAll(async () => {
    await ModelFactory.sequelize.close();
  });

  it('should create message in db', async () => {
    const conversationId = uuid();
    const messageId = uuid();
    const message = { messageId, conversationId, type };
    await createMessage(message);

    const actualMessage = await Message.findByPk(messageId);
    expect(actualMessage).toMatchObject(message);
  });

  it('should not save message with wrong type', async () => {
    const conversationId = uuid();
    const messageId = uuid();
    const message = { messageId, conversationId, type: 'not-a-valid-type' };

    let caughtException = null;
    try {
      await createMessage(message);
    } catch (e) {
      caughtException = e;
    }
    expect(caughtException).not.toBeNull();
    expect(logError).toHaveBeenCalledWith(
      'Message could not be stored because: Validation error: Validation isIn on type failed'
    );
    const actualMessage = await Message.findByPk(messageId);
    expect(actualMessage).toBeNull();
  });
});
