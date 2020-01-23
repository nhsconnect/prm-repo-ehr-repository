import ModelFactory from '../../models';

jest.mock('uuid/v4');

const mockReturnFragment = {
  id: 'some-uuid',
  message_id: 'message-id',
  health_record_id: 'some-health-record',
  completed_at: null,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null
};

describe('MessageFragment', () => {
  const sequelize = ModelFactory.sequelize;
  const MessageFragment = ModelFactory.getByName('MessageFragment');

  const messageId = 'message-id';

  beforeEach(
    () =>
      (MessageFragment.findOrCreate = jest.fn().mockImplementation(() =>
        Promise.resolve([
          {
            get: jest.fn().mockReturnValue(mockReturnFragment)
          }
        ])
      ))
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    sequelize.close();
  });

  describe('findOrCreateOne', () => {
    it('should return mock Message Fragment when findOrCreate is called', () => {
      return MessageFragment.findOrCreate({}).then(fragments => {
        expect(fragments[0].get().message_id).toBe(messageId);
        return expect(fragments[0].get().id).toBe('some-uuid');
      });
    });

    it('should call findOrCreate with where: message_id', () => {
      return sequelize.transaction().then(t =>
        MessageFragment.findOrCreateOne(messageId, t)
          .then(() => {
            expect(MessageFragment.findOrCreate).toHaveBeenCalledTimes(1);
            return expect(MessageFragment.findOrCreate).toHaveBeenCalledWith({
              where: {
                message_id: messageId
              },
              transaction: t
            });
          })
          .finally(() => t.rollback())
      );
    });
  });
});
