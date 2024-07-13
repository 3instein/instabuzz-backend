import { Router, Request, Response } from 'express';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Example of a protected route
router.get('/protected', authenticate
, (req: Request, res: Response) => {
    return res.json({ message: 'This is a protected route' });
});

export default router;
