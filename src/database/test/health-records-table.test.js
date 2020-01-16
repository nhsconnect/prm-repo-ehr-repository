import ModelFactory from '../models';
import uuid from 'uuid/v4';

describe('HealthRecord', () => {
  const HealthRecord = ModelFactory.getByName('HealthRecord');

  const uuidPattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
  const convoIdPattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

  afterAll(() => {
    return ModelFactory.sequelize.close();
  });

  it('should return id as a valid uuid', () => {
    return HealthRecord.findAll({}).then(value => {
      return expect(value[0].dataValues.id).toMatch(uuidPattern);
    });
  });

  it('should return the valid patient_id as an Integer', () => {
    return HealthRecord.findAll({}).then(value => {
      return expect(typeof value[0].dataValues.patient_id).toBe(typeof 0);
    });
  });

  it('should return a valid conversation_id', () => {
    return HealthRecord.findAll({}).then(value => {
      return expect(value[0].dataValues.conversation_id).toMatch(convoIdPattern);
    });
  });

  it('should return null object for completed_at', () => {
    return HealthRecord.findAll({}).then(value => {
      return expect(value[0].dataValues.completed_at).toBeNull();
    });
  });

  it('should return Date object for created_at', () => {
    return HealthRecord.findAll({}).then(value => {
      return expect(typeof value[0].dataValues.created_at).toBe(typeof new Date());
    });
  });

  it('should return Date object for updated_at', () => {
    return HealthRecord.findAll({}).then(value => {
      return expect(typeof value[0].dataValues.updated_at).toBe(typeof new Date());
    });
  });

  it('should return null for deleted_at', () => {
    return HealthRecord.findAll({}).then(value => {
      return expect(value[0].dataValues.deleted_at).toBe(null);
    });
  });

  it('should return is_completed as a boolean', () => {
    return HealthRecord.findAll({}).then(value => {
      return expect(value[0].dataValues.is_completed).toBe(false);
    });
  });

  it('should return 1 for items deleted and deleted_at should have been updated', () => {
    const destroyOptions = {
      where: {
        id: '99ba0ba1-ed1a-4fc1-ab5b-9d79af71aef4'
      }
    };

    return HealthRecord.destroy(destroyOptions)
      .then(value => {
        expect(value).toBe(1);
        return HealthRecord.findOne({ ...destroyOptions, paranoid: false }).then(value => {
          return expect(typeof value.dataValues.deleted_at).toBe(typeof new Date());
        });
      })
      .finally(() => {
        return HealthRecord.restore({ ...destroyOptions, paranoid: false });
      });
  });

  it('should return 1 for items restored and deleted_at should have been removed', () => {
    const restoreOptions = {
      where: {
        id: '0879b920-7174-4ef1-92f7-12383114b052'
      }
    };

    return HealthRecord.restore({ ...restoreOptions, paranoid: false })
      .then(value => {
        expect(value).toBe(1);
        return HealthRecord.findOne(restoreOptions).then(value => {
          return expect(typeof value.dataValues.deleted_at).toBe(typeof new Date());
        });
      })
      .finally(() => {
        return HealthRecord.destroy(restoreOptions);
      });
  });

  it('should not return anything if record has been destroyed (soft)', () => {
    const destroyedOptions = {
      where: {
        id: '0879b920-7174-4ef1-92f7-12383114b052'
      }
    };

    return HealthRecord.findOne(destroyedOptions).then(value => {
      return expect(value).toBeNull();
    });
  });

  it('should create new entry using model', () => {
    const new_entry_params = {
      id: uuid(),
      patient_id: 1,
      conversation_id: uuid()
    };

    return HealthRecord.create(new_entry_params)
      .then(value => {
        expect(value.dataValues.created_at).not.toBeNull();
        expect(value.dataValues.updated_at).not.toBeNull();
        expect(value.dataValues.deleted_at).toBeNull();
        expect(value.dataValues.completed_at).toBeNull();
        expect(value.dataValues.patient_id).toBe(new_entry_params.patient_id);
        expect(value.dataValues.conversation_id).toMatch(new_entry_params.conversation_id);
        expect(value.dataValues.id).toMatch(new_entry_params.id);
      })
      .finally(() => {
        // force = true -> Hard Delete
        return HealthRecord.destroy({
          where: { id: new_entry_params.id },
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
        id: '7d5712f2-d203-4f11-8527-1175db0d2a4a'
      }
    };

    return HealthRecord.update(
      {
        patient_id: 2
      },
      updateOptions
    ).then(value => {
      expect(value[0]).toBe(1);

      return HealthRecord.findOne(updateOptions).then(value => {
        return expect(value.dataValues.updated_at.toISOString()).not.toBe(
          value.dataValues.created_at.toISOString()
        );
      });
    });
  });

  it('should update the completed_at with Date when complete is called', () => {
    const completeOptions = {
      where: {
        id: '7d5712f2-d203-4f11-8527-1175db0d2a4a'
      }
    };

    return HealthRecord.complete(completeOptions)
      .then(value => {
        return expect(value).toContain(1);
      })
      .finally(() => {
        return HealthRecord.findOne(completeOptions).then(value => {
          return expect(value.dataValues.completed_at).not.toBeNull();
        });
      });
  });
});
