const schedule = require('node-schedule');
const { ehrDeletionJob } = require('../ehr-deletion-job');

describe('ehr-deletion-job.js', () => {
  it('should run the job at 3AM every night', async () => {
    // given
    jest.useFakeTimers();

    // when
    await ehrDeletionJob();

    // then
    expect(schedule.scheduledJobs).toHaveProperty('ehrDeletionJob');
    jest.runOnlyPendingTimers(); // Run the pending timers
  });
});
