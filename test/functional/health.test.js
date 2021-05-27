import axios from 'axios';
import adapter from 'axios/lib/adapters/http';

describe('GET /health', () => {
  it('should return true for all dependencies', async () => {
    const res = await axios.get(`${process.env.SERVICE_URL}/health`, { adapter });

    expect(res.data).toEqual(
      expect.objectContaining({
        version: '1',
        description: 'Health of EHR Repo service',
        details: expect.objectContaining({
          filestore: expect.objectContaining({
            available: true,
            writable: true,
          }),
          database: expect.objectContaining({
            connection: true,
            writable: true,
          }),
        }),
      })
    );
  });
});
