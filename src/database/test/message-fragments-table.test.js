import models from '../models';
import uuid from 'uuid/v4';

describe('models.MessageFragment', () => {
  const MessageFragment = models.MessageFragment;

  const uuidPattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
  const convoIdPattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

  afterAll(() => {
    return models.sequelize.close();
  });

  it('should return id as an Integer type', () => {
    return MessageFragment.findAll({ where: {} }).then(value => {
      return expect(typeof value[0].dataValues.id).toBe(typeof 0);
    });
  });

  it('should return slug as a valid uuid', () => {
    return MessageFragment.findAll({ where: {} }).then(value => {
      return expect(value[0].dataValues.slug).toMatch(uuidPattern);
    });
  });

  it('should return a valid conversation_id', () => {
    return MessageFragment.findAll({ where: {} }).then(value => {
      return expect(value[0].dataValues.conversation_id).toMatch(convoIdPattern);
    });
  });

  it('should return null object for transfer_completed_at', () => {
    return MessageFragment.findAll({ where: {} }).then(value => {
      return expect(value[0].dataValues.transfer_completed_at).toBeNull();
    });
  });

  it('should return Date object for created_at', () => {
    return MessageFragment.findAll({ where: {} }).then(value => {
      return expect(typeof value[0].dataValues.created_at).toBe(typeof new Date());
    });
  });

  it('should return Date object for updated_at', () => {
    return MessageFragment.findAll({ where: {} }).then(value => {
      return expect(typeof value[0].dataValues.updated_at).toBe(typeof new Date());
    });
  });

  it('should return null for deleted_at', () => {
    return MessageFragment.findAll({ where: {} }).then(value => {
      return expect(value[0].dataValues.deleted_at).toBe(null);
    });
  });

  it('should return 1 for items deleted and deleted_at should have been updated', () => {
    const destroyOptions = {
      where: {
        id: 2
      }
    };

    return MessageFragment.destroy(destroyOptions)
      .then(value => {
        expect(value).toBe(1);
        return MessageFragment.findOne({ ...destroyOptions, paranoid: false }).then(value => {
          return expect(typeof value.dataValues.deleted_at).toBe(typeof new Date());
        });
      })
      .finally(() => {
        return MessageFragment.restore({ ...destroyOptions, paranoid: false });
      });
  });

  it('should return 1 for items restored and deleted_at should have been removed', () => {
    const restoreOptions = {
      where: {
        id: 3
      }
    };

    return MessageFragment.restore({ ...restoreOptions, paranoid: false })
      .then(value => {
        expect(value).toBe(1);
        return MessageFragment.findOne(restoreOptions).then(value => {
          return expect(typeof value.dataValues.deleted_at).toBe(typeof new Date());
        });
      })
      .finally(() => {
        return MessageFragment.destroy(restoreOptions);
      });
  });

  it('should not return anything if record has been destroyed (soft)', () => {
    const destroyedOptions = {
      where: {
        id: 3
      }
    };

    return MessageFragment.findOne(destroyedOptions).then(value => {
      return expect(value).toBeNull();
    });
  });

  it('should create new entry using model', () => {
    const new_entry_params = {
      slug: uuid(),
      conversation_id: uuid()
    };

    return MessageFragment.create(new_entry_params)
      .then(value => {
        expect(value.dataValues.id).not.toBeNull();
        expect(value.dataValues.created_at).not.toBeNull();
        expect(value.dataValues.updated_at).not.toBeNull();
        expect(value.dataValues.deleted_at).toBeNull();
        expect(value.dataValues.transfer_completed_at).toBeNull();
        expect(value.dataValues.conversation_id).toMatch(new_entry_params.conversation_id);
        return expect(value.dataValues.slug).toMatch(new_entry_params.slug);
      })
      .finally(() => {
        // force = true -> Hard Delete
        return MessageFragment.destroy({
          where: { slug: new_entry_params.slug },
          paranoid: false,
          force: true
        }).then(value => {
          return expect(value).toBe(1);
        });
      });
  });

  it('should update the updated_at with a record update', () => {
    const updateOptions = {
      where: {
        id: 1
      }
    };

    return MessageFragment.update(
      {
        conversation_id: uuid()
      },
      updateOptions
    ).then(value => {
      expect(value[0]).toBe(1);

      return MessageFragment.findOne(updateOptions).then(value => {
        return expect(value.dataValues.updated_at.toISOString()).not.toBe(
          value.dataValues.created_at.toISOString()
        );
      });
    });
  });

  it('should update the transfer_completed_at with Date when complete is called', () => {
    const completeOptions = {
      where: {
        id: 1
      }
    };

    return MessageFragment.complete(completeOptions)
      .then(value => {
        return expect(value).toContain(1);
      })
      .finally(() => {
        return MessageFragment.findOne(completeOptions).then(value => {
          return expect(value.dataValues.completed_at).not.toBeNull();
        });
      });
  });
});
