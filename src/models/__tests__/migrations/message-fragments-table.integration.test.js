import uuid from 'uuid/v4';
import ModelFactory from '../../index';

jest.mock('uuid/v4');

describe('MessageFragment', () => {
  const testUUID = '0af9f62f-0e6b-4378-8cfc-dcb4f9e3ec54';

  const MessageFragment = ModelFactory.getByName('MessageFragment');
  const sequelize = ModelFactory.sequelize;

  const uuidPattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
  const messageIdPattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

  beforeEach(() => {
    uuid.mockImplementation(() => testUUID);
  });

  afterAll(() => {
    sequelize.close();
  });

  it('should return id as a valid uuid', () => {
    return MessageFragment.findOne().then(messageFragment =>
      expect(messageFragment.get().id).toMatch(uuidPattern)
    );
  });

  it('should return a valid message_id', () => {
    return MessageFragment.findOne().then(messageFragment =>
      expect(messageFragment.get().message_id).toMatch(messageIdPattern)
    );
  });

  it('should return null object for completed_at', () => {
    return MessageFragment.findOne().then(messageFragment =>
      expect(messageFragment.get().completed_at).toBeNull()
    );
  });

  it('should return Date object for created_at', () => {
    return MessageFragment.findOne().then(messageFragment =>
      expect(typeof messageFragment.get().created_at).toBe(typeof new Date())
    );
  });

  it('should return Date object for updated_at', () => {
    return MessageFragment.findOne().then(messageFragment =>
      expect(typeof messageFragment.get().updated_at).toBe(typeof new Date())
    );
  });

  it('should return null for deleted_at', () => {
    return MessageFragment.findOne().then(messageFragment =>
      expect(messageFragment.get().deleted_at).toBe(null)
    );
  });

  it('should return 1 for items deleted and deleted_at should have been updated', () => {
    const messageFragmentId = {
      id: 'a1ff815c-6452-4020-ab13-9200d27a06ed'
    };

    return sequelize.transaction().then(t =>
      MessageFragment.destroy({ ...where(messageFragmentId), transaction: t })
        .then(destroyed => expect(destroyed).toBe(1))
        .then(() =>
          MessageFragment.findOne({ ...where(messageFragmentId), paranoid: false, transaction: t })
        )
        .then(messageFragment =>
          expect(typeof messageFragment.get().deleted_at).toBe(typeof new Date())
        )
        .finally(() => t.rollback())
    );
  });

  it('should return 1 for items restored and deleted_at should have been removed', () => {
    const messageFragmentId = {
      id: 'c47134d3-6ef7-4852-8e86-a5fd1a3c81ce'
    };

    return sequelize.transaction().then(t =>
      MessageFragment.restore({ ...where(messageFragmentId), paranoid: false, transaction: t })
        .then(restored => expect(restored).toBe(1))
        .then(() => MessageFragment.findOne({ ...where(messageFragmentId), transaction: t }))
        .then(messageFragment =>
          expect(typeof messageFragment.get().deleted_at).toBe(typeof new Date())
        )
        .finally(() => t.rollback())
    );
  });

  it('should not return anything if record has been destroyed (soft)', () => {
    const messageFragmentId = {
      id: 'c47134d3-6ef7-4852-8e86-a5fd1a3c81ce'
    };

    return MessageFragment.findOne(where(messageFragmentId)).then(value =>
      expect(value).toBeNull()
    );
  });

  it('should create new entry using model', () => {
    const newMessageFragment = {
      message_id: uuid()
    };

    return sequelize.transaction().then(t =>
      MessageFragment.create(newMessageFragment, { transaction: t })
        .then(messageFragment => {
          expect(messageFragment.get().created_at).not.toBeNull();
          expect(messageFragment.get().updated_at).not.toBeNull();
          expect(messageFragment.get().deleted_at).toBeNull();
          expect(messageFragment.get().completed_at).toBeNull();
          expect(messageFragment.get().message_id).toMatch(newMessageFragment.message_id);
          return expect(messageFragment.get().id).toMatch(testUUID);
        })
        .finally(() => t.rollback())
    );
  });

  it('should update the updated_at with a record update', () => {
    const messageFragmentId = {
      id: '74c6230b-36d9-4940-bdd6-495ba87ed634'
    };

    return sequelize.transaction().then(t =>
      MessageFragment.update(
        { message_id: uuid() },
        { ...where(messageFragmentId), transaction: t }
      )
        .then(updated => expect(updated[0]).toBe(1))
        .then(() => MessageFragment.findOne({ ...where(messageFragmentId), transaction: t }))
        .then(messageFragment =>
          expect(messageFragment.get().updated_at.toISOString()).not.toBe(
            messageFragment.get().created_at.toISOString()
          )
        )
        .finally(() => t.rollback())
    );
  });

  it('should update the completed_at with Date when complete is called', () => {
    const messageFragmentId = {
      id: '74c6230b-36d9-4940-bdd6-495ba87ed634'
    };

    return sequelize.transaction().then(t =>
      MessageFragment.complete({ ...where(messageFragmentId), transaction: t })
        .then(completed => expect(completed).toContain(1))
        .then(() => MessageFragment.findOne({ ...where(messageFragmentId), transaction: t }))
        .then(messageFragment => expect(messageFragment.get().completed_at).not.toBeNull())
        .finally(() => t.rollback())
    );
  });
});

const where = body => ({ where: body });
