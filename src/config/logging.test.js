import { obfuscateSecrets } from './logging';

describe('logging', () => {
  describe('obfuscateSecrets', () => {
    it('should replace secret values with obfuscated value', () => {
      const formatter = obfuscateSecrets();

      const messageSymbol = Symbol('message');
      const result = formatter.transform({
        message: `some-message`,
        data: 'secret-payload',
        error: {
          port: 61614,
          connectArgs: {
            ssl: true,
            connectHeaders: {
              login: 'abcdefg',
              passcode: '1234567'
            }
          }
        },
        [messageSymbol]: 'some-symbol-message'
      });

      expect(result).toEqual({
        message: `some-message`,
        data: '********',
        error: {
          port: 61614,
          connectArgs: {
            ssl: true,
            connectHeaders: {
              login: 'abcdefg',
              passcode: '********'
            }
          }
        },
        [messageSymbol]: 'some-symbol-message'
      });
    });
  });
});
