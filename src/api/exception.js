import express from 'express';
import { validate } from '../middleware/validation';

const router = express.Router();

router.get('/', validate, () => {
  throw new Error('UNHANDLED ERROR');
});
export default router;
