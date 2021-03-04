import axios from 'axios';
import adapter from 'axios/lib/adapters/http';
import { initializeConfig } from '../../src/config';

describe('GET /health', () => {
  const config = initializeConfig();
  it('should return true for all dependencies', async done => {
    const res = await axios.get(`${config.ehrRepoServiceUrl}/health`, { adapter });

    expect(res.data).toEqual(
      expect.objectContaining({
        version: '1',
        description: 'Health of EHR Repo service',
        details: expect.objectContaining({
          filestore: expect.objectContaining({
            available: true,
            writable: true
          }),
          database: expect.objectContaining({
            connection: true,
            writable: true
          })
        })
      })
    );
    done();
  });
});
