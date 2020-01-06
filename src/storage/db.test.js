import { save, saveHealthCheck } from './db';
import models from "../database/models";
import uuid from "uuid/v4";

describe('db', () => {

  const HealthRecord = models.HealthRecord;
  const HealthCheck = models.HealthCheck;

  const storageFile = uuid();
  const nhsNumber = "198765";

  afterAll(() => {
    return models.sequelize.close();
  });

  describe('save', () => {
    it('should save the nhs number and storage location to the db', () => {

      return save(nhsNumber, storageFile)
        .then(() => {
          return expect(HealthRecord.findOne({where: {patient_id: nhsNumber}}).then(result => {
            return expect(result.dataValues.slug).toBe(storageFile);
          }));
        });
    });
  });

  describe('saveHealthCheckToDB', () => {

    it('should save the timestamp to the db in health table', () => {
      return saveHealthCheck()
        .then(value => {
          return HealthCheck.findOne({ where: {slug: value}}).then(result => {
            return expect(result.dataValues.completed_at).not.toBeNull();
          });
        });
    });
  });
});
