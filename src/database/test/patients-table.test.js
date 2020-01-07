import ModelFactory from '../models';
import uuid from 'uuid/v4';

describe('Patient', () => {
  const Patient = ModelFactory.getByName('Patient');

  const uuidPattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
  const nhsNumberPattern = /^[0-9]{6}$/;

  afterAll(() => {
    return ModelFactory.sequelize.close();
  });

  it('should return id as an INTEGER type', () => {
    return Patient.findAll({ where: {} }).then(value => {
      return expect(typeof value[0].dataValues.id).toBe(typeof 0);
    });
  });

  it('should return slug as a valid uuid', () => {
    return Patient.findAll({ where: {} }).then(value => {
      return expect(value[0].dataValues.slug).toMatch(uuidPattern);
    });
  });

  it('should return a valid nhs_number made of 6 numbers', () => {
    return Patient.findAll({ where: {} }).then(value => {
      return expect(value[0].dataValues.nhs_number).toMatch(nhsNumberPattern);
    });
  });

  it('should return Date object for created_at', () => {
    return Patient.findAll({ where: {} }).then(value => {
      return expect(typeof value[0].dataValues.created_at).toBe(typeof new Date());
    });
  });

  it('should return Date object for updated_at', () => {
    return Patient.findAll({ where: {} }).then(value => {
      return expect(typeof value[0].dataValues.updated_at).toBe(typeof new Date());
    });
  });

  it('should return null for deleted_at', () => {
    return Patient.findAll({ where: {} }).then(value => {
      return expect(value[0].dataValues.deleted_at).toBe(null);
    });
  });

  it('should return 1 for items deleted and deleted_at should have been updated', () => {
    const destroyOptions = {
      where: {
        slug: 'd126ee7f-035e-4938-8996-09a28c2ba61c'
      }
    };

    return Patient.destroy(destroyOptions)
      .then(value => {
        expect(value).toBe(1);
        return Patient.findOne({ ...destroyOptions, paranoid: false }).then(value => {
          return expect(typeof value.dataValues.deleted_at).toBe(typeof new Date());
        });
      })
      .finally(() => {
        return Patient.restore({ ...destroyOptions, paranoid: false });
      });
  });

  it('should return 1 for items restored and deleted_at should have been removed', () => {
    const restoreOptions = {
      where: {
        slug: '944513e3-9f12-4284-b23c-8c319dbd3599'
      }
    };

    return Patient.restore({ ...restoreOptions, paranoid: false })
      .then(value => {
        expect(value).toBe(1);
        return Patient.findOne(restoreOptions).then(value => {
          return expect(typeof value.dataValues.deleted_at).toBe(typeof new Date());
        });
      })
      .finally(() => {
        return Patient.destroy(restoreOptions);
      });
  });

  it('should not return anything if record has been destroyed (soft)', () => {
    const destroyedOptions = {
      where: {
        slug: '944513e3-9f12-4284-b23c-8c319dbd3599'
      }
    };

    return Patient.findOne(destroyedOptions).then(value => {
      return expect(value).toBeNull();
    });
  });

  it('should create new entry using model', () => {
    const new_entry_params = {
      nhs_number: '444444',
      slug: uuid()
    };

    return Patient.create(new_entry_params)
      .then(value => {
        expect(value.dataValues.id).not.toBeNull();
        expect(value.dataValues.created_at).not.toBeNull();
        expect(value.dataValues.updated_at).not.toBeNull();
        expect(value.dataValues.deleted_at).toBeNull();
        expect(value.dataValues.nhs_number).toMatch(new_entry_params.nhs_number);
        return expect(value.dataValues.slug).toMatch(new_entry_params.slug);
      })
      .finally(() => {
        return Patient.destroy({
          where: { nhs_number: '444444' },
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
        slug: 'e479ca12-4a7d-41cb-86a2-775f36b8a0d1'
      }
    };

    return Patient.update(
      {
        nhs_number: 111112
      },
      updateOptions
    ).then(value => {
      expect(value[0]).toBe(1);
      return Patient.findOne(updateOptions).then(value => {
        return expect(value.dataValues.updated_at.toISOString()).not.toBe(
          value.dataValues.created_at.toISOString()
        );
      });
    });
  });

  it('should reject with error if not all required parameters are provided', () => {
    const new_entry_params = {
      nhs_number: '555555'
    };

    return expect(Patient.create(new_entry_params)).rejects.toThrowError(
      /notNull violation: Patient.slug/i
    ); //
  });
});
