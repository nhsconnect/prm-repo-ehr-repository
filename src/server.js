import app from './app';
import { logEvent } from './middleware/logging';

const port = process.env.PORT || 3000;

app.listen(port, () => logEvent(`Listening on port ${port}`));
