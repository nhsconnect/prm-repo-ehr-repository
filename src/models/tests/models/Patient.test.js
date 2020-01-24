import ModelFactory from '../../index';

jest.mock('uuid/v4');

const mockReturnPatient = {
  id: 'some-uuid',
  nhs_number: '1234567890',
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null
};

describe('Patient', () => {
  const sequelize = ModelFactory.sequelize;
  const Patient = ModelFactory.getByName('Patient');

  const nhsNumber = '1234567890';

  beforeEach(
    () =>
      (Patient.findOrCreate = jest.fn().mockImplementation(() =>
        Promise.resolve([
          {
            get: jest.fn().mockReturnValue(mockReturnPatient)
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
    it('should return mock Patient when findOrCreate is called', () => {
      return Patient.findOrCreate({}).then(patients => {
        expect(patients[0].get().nhs_number).toBe(nhsNumber);
        return expect(patients[0].get().id).toBe('some-uuid');
      });
    });

    it('should call findOrCreate with where: nhs_number', () => {
      return sequelize.transaction().then(t =>
        Patient.findOrCreateOne(nhsNumber, t)
          .then(() => {
            expect(Patient.findOrCreate).toHaveBeenCalledTimes(1);
            return expect(Patient.findOrCreate).toHaveBeenCalledWith({
              where: {
                nhs_number: nhsNumber
              },
              transaction: t
            });
          })
          .finally(() => t.rollback())
      );
    });
  });
});
