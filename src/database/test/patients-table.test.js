import models from "../models";
import uuid from "uuid/v4";

describe("models.Patient", () => {

  const Patient = models.Patient;
  const uuidPattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
  const nhsNumberPattern = /^[0-9]{6}$/;

  afterAll(() => {
    return models.sequelize.close();
  });

  it("should return id as an INTEGER type", () => {
    return Patient.findAll({ where: {} }).then(value => {
      return expect(typeof value[0].dataValues.id).toBe(typeof 0);
    });
  });

  it("should return slug as a valid uuid", () => {
    return Patient.findAll({ where: {} }).then(value => {
      return expect(value[0].dataValues.slug).toMatch(uuidPattern);
    });
  });

  it("should return a valid nhs_number made of 6 numbers", () => {
    return Patient.findAll({ where: {} }).then(value => {
      return expect(value[0].dataValues.nhs_number).toMatch(nhsNumberPattern);
    });
  });

  it("should return Date object for created_at", () => {
    return Patient.findAll({ where: {} }).then(value => {
      return expect(typeof value[0].dataValues.created_at).toBe(typeof new Date());
    });
  });

  it("should return Date object for updated_at", () => {
    return Patient.findAll({ where: {} }).then(value => {
      return expect(typeof value[0].dataValues.updated_at).toBe(typeof new Date());
    });
  });

  it("should return null for deleted_at", () => {
    return Patient.findAll({ where: {} }).then(value => {
      return expect(value[0].dataValues.deleted_at).toBe(null);
    });
  });

  it("should return 1 for items deleted and deleted_at should have been updated", () => {

    const destroyOptions = {
      where: {
        id: 2
      }
    };

    return Patient.destroy(destroyOptions)
      .then(value => {
        expect(value).toBe(1);
        return Patient.findOne({ ...destroyOptions, paranoid: false }).then(value => {
          return expect(typeof value.dataValues.deleted_at).toBe(typeof new Date);
        });
      }).finally(() => {
        return Patient.restore({ ...destroyOptions, paranoid: false });
      });
  });

  it("should return 1 for items restored and deleted_at should have been removed", () => {

    const restoreOptions = {
      where: {
        id: 3
      }
    };

    return Patient.restore({ ...restoreOptions, paranoid: false })
      .then(value => {
        expect(value).toBe(1);
        return Patient.findOne(restoreOptions).then(value => {
          return expect(typeof value.dataValues.deleted_at).toBe(typeof new Date);
        });
      }).finally(() => {
        return Patient.destroy(restoreOptions);
      });
  });

  it("should not return anything if record has been destroyed (soft)", () => {
    const destroyedOptions = {
      where: {
        id: 3
      }
    };

    return Patient.findOne(destroyedOptions).then(value => {
      return expect(value).toBeNull();
    });
  });

  it("should create new entry using model", () => {
    const new_entry_params = {
        nhs_number: "444444",
        slug: uuid()
    };

    return Patient.create(new_entry_params).then(value => {
        expect(value.dataValues.id).not.toBeNull();
        expect(value.dataValues.created_at).not.toBeNull();
        expect(value.dataValues.updated_at).not.toBeNull();
        expect(value.dataValues.deleted_at).toBeNull();
        expect(value.dataValues.nhs_number).toMatch(new_entry_params.nhs_number);
        return expect(value.dataValues.slug).toMatch(new_entry_params.slug);
    }).finally(() => {
        return Patient.destroy({where: {nhs_number: "444444"}, paranoid: false, force: true}).then(value => {
            return expect(value).toBe(1);
        });
    });
  });

  it("should update the updated_at with a record update", () => {
      const updateOptions = {
          where: {
              id: 1
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
              return expect(value.dataValues.updated_at.toISOString()).not.toBe(value.dataValues.created_at.toISOString());
          });
      });
  });

  it("should reject with error if not all required parameters are provided", () => {
    const new_entry_params = {
      nhs_number: "555555"
    };

    return expect(Patient.create(new_entry_params)).rejects.toThrowError(/notNull violation: Patient.slug/i);//
  });
});