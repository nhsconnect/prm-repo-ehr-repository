import app from './app';
import { logInfo } from './middleware/logging';

const port = process.env.PORT || 3000;

app.listen(port, () => logInfo(`Listening on port ${port}`));
