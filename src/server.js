import app from './app';
import { logInfo } from './middleware/logging';
import { portNumber } from './config';

const port = portNumber || 3000;

app.listen(port, () => logInfo(`Listening on port ${port}`));
