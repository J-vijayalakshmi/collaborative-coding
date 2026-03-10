import { Router } from 'express';
import { executeCode, getCreditUsage } from '../controllers/executeController';

const router = Router();

// Execute code
router.post('/', executeCode);

// Get credit usage (optional - for monitoring)
router.get('/credits', getCreditUsage);

export default router;
