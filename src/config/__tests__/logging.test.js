import logger, { obfuscateSecrets, options } from '../logging';

jest.mock('winston', () => ({
  ...jest.requireActual('winston'),
  createLogger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    error: jest.fn()
  }))
}));

describe('logging', () => {
  describe('obfuscateSecrets', () => {
    const formatter = obfuscateSecrets();
    const obfuscatedString = '********';

    it('should replace top level data key value with obfuscated values', () => {
      const obfuscatedObject = formatter.transform({
        data: 'secret-payload'
      });

      expect(obfuscatedObject).toStrictEqual(
        expect.objectContaining({
          data: obfuscatedString
        })
      );
    });

    it('should replace top level passcode key value with obfuscated values', () => {
      const obfuscatedObject = formatter.transform({
        passcode: '123456789'
      });

      expect(obfuscatedObject).toStrictEqual(
        expect.objectContaining({
          passcode: obfuscatedString
        })
      );
    });

    it('should replace nested passcode key value with obfuscated values', () => {
      const obfuscatedObject = formatter.transform({
        nested: {
          passcode: '123456789'
        }
      });

      expect(obfuscatedObject).toStrictEqual(
        expect.objectContaining({
          nested: {
            passcode: obfuscatedString
          }
        })
      );
    });

    it('should replace nested passcode key value with obfuscated values', () => {
      const obfuscatedObject = formatter.transform({
        nested: {
          data: 'some-secret-data'
        }
      });

      expect(obfuscatedObject).toStrictEqual(
        expect.objectContaining({
          nested: {
            data: obfuscatedString
          }
        })
      );
    });
  });

  describe('options', () => {
    it('should contain one transport', () => {
      expect(options.transports.length).toBe(1);
    });

    it('should be at level debug', () => {
      expect(options.level).toBe('debug');
    });

    it('should have a formatter', () => {
      expect(options.format).not.toBeNull();
    });
  });

  describe('logger.error override', () => {
    const message = 'failed';
    const errorMessage = 'some-error';

    it('should call logger.log only once', () => {
      logger.error(message, Error(errorMessage));
      expect(logger.log).toHaveBeenCalledTimes(1);
    });

    it('should call logger.log with correct message', () => {
      logger.error(message, Error(errorMessage));
      expect(logger.log).toHaveBeenCalledWith(
        'error',
        `${message}: ${errorMessage}`,
        expect.objectContaining(Error(errorMessage))
      );
    });
  });
});
