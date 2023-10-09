import app from './app';
import { logInfo } from './middleware/logging';
import { portNumber } from './config';
// { ehrDeletionJob } from './services/jobs/ehr-deletion-job/ehr-deletion-job';

const port = portNumber || 3000;

app.listen(port, () => {
  logInfo(`Listening on port ${port}`);
  // startScheduledJobs();
});

// const startScheduledJobs = () => {
//   ehrDeletionJob.start();
// };
