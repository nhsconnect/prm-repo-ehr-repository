import { ehrDeletionJob } from './services/jobs/ehr-deletion-job/ehr-deletion-job';
import { logInfo } from './middleware/logging';
import { portNumber } from './config';
import app from './app';

const port = portNumber || 3000;

app.listen(port, () => {
  logInfo(`Listening on port ${port}`);
  startScheduledJobs();
});

const startScheduledJobs = () => {
  ehrDeletionJob.start();
};
