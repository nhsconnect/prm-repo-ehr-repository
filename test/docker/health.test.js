import axios from 'axios';

describe('GET /health', () => {
  it('should return true for all dependencies', async () => {
    console.log('Calling health check endpoint: %s', `${process.env.SERVICE_URL}/health`);
    
    const res = await axios.get(`${process.env.SERVICE_URL}/health`, { adapter: 'http' });

    expect(res.data).toEqual(
      expect.objectContaining({
        version: '1',
        description: 'Health of EHR Repo service',
        details: expect.objectContaining({
          filestore: expect.objectContaining({
            available: true,
            writable: true
          })
        })
      })
    );
  });
});
