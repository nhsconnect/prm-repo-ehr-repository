import ModelFactory from '../models';
import uuid from 'uuid/v4';

describe('HealthRecordManfiest', () => {
  const HealthRecordManifest = ModelFactory.getByName('HealthRecordManifest');

  const uuidPattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
  const convoIdPattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

  afterAll(() => {
    return ModelFactory.sequelize.close();
  });

  it('should return id as an Integer type', () => {
    return HealthRecordManifest.findAll({ where: {} }).then(value => {
      return expect(typeof value[0].dataValues.id).toBe(typeof 0);
    });
  });

  it('should return slug as a valid uuid', () => {
    return HealthRecordManifest.findAll({ where: {} }).then(value => {
      return expect(value[0].dataValues.slug).toMatch(uuidPattern);
    });
  });

  it('should return a valid conversation_id', () => {
    return HealthRecordManifest.findAll({ where: {} }).then(value => {
      return expect(value[0].dataValues.conversation_id).toMatch(convoIdPattern);
    });
  });

  it('should return null object for transfer_completed_at', () => {
    return HealthRecordManifest.findAll({ where: {} }).then(value => {
      return expect(value[0].dataValues.transfer_completed_at).toBeNull();
    });
  });

  it('should return Date object for created_at', () => {
    return HealthRecordManifest.findAll({ where: {} }).then(value => {
      return expect(typeof value[0].dataValues.created_at).toBe(typeof new Date());
    });
  });

  it('should return Date object for updated_at', () => {
    return HealthRecordManifest.findAll({ where: {} }).then(value => {
      return expect(typeof value[0].dataValues.updated_at).toBe(typeof new Date());
    });
  });

  it('should return null for deleted_at', () => {
    return HealthRecordManifest.findAll({ where: {} }).then(value => {
      return expect(value[0].dataValues.deleted_at).toBe(null);
    });
  });

  it('should return 1 for items deleted and deleted_at should have been updated', () => {
    const destroyOptions = {
      where: {
        id: 2
      }
    };

    return HealthRecordManifest.destroy(destroyOptions)
      .then(value => {
        expect(value).toBe(1);
        return HealthRecordManifest.findOne({ ...destroyOptions, paranoid: false }).then(value => {
          return expect(typeof value.dataValues.deleted_at).toBe(typeof new Date());
        });
      })
      .finally(() => {
        return HealthRecordManifest.restore({ ...destroyOptions, paranoid: false });
      });
  });

  it('should return 1 for items restored and deleted_at should have been removed', () => {
    const restoreOptions = {
      where: {
        id: 3
      }
    };

    return HealthRecordManifest.restore({ ...restoreOptions, paranoid: false })
      .then(value => {
        expect(value).toBe(1);
        return HealthRecordManifest.findOne(restoreOptions).then(value => {
          return expect(typeof value.dataValues.deleted_at).toBe(typeof new Date());
        });
      })
      .finally(() => {
        return HealthRecordManifest.destroy(restoreOptions);
      });
  });

  it('should not return anything if record has been destroyed (soft)', () => {
    const destroyedOptions = {
      where: {
        id: 3
      }
    };

    return HealthRecordManifest.findOne(destroyedOptions).then(value => {
      return expect(value).toBeNull();
    });
  });

  it('should create new entry using model', () => {
    const new_entry_params = {
      slug: uuid(),
      conversation_id: uuid()
    };

    return HealthRecordManifest.create(new_entry_params)
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
        return HealthRecordManifest.destroy({
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

    return HealthRecordManifest.update(
      {
        conversation_id: uuid()
      },
      updateOptions
    ).then(value => {
      expect(value[0]).toBe(1);

      return HealthRecordManifest.findOne(updateOptions).then(value => {
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

    return HealthRecordManifest.complete(completeOptions)
      .then(value => {
        return expect(value).toContain(1);
      })
      .finally(() => {
        return HealthRecordManifest.findOne(completeOptions).then(value => {
          return expect(value.dataValues.completed_at).not.toBeNull();
        });
      });
  });
});
