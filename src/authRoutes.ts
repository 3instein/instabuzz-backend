import { Router, Request, Response } from 'express';
import { expressjwt } from 'express-jwt';

const router = Router();
const secret = 'm@klo123';

const authenticate = expressjwt({ secret: secret, algorithms: ['HS256'] });

// Example of a protected route
router.get('/protected', authenticate, (req: Request, res: Response) => {
    return res.json({ message: 'This is a protected route' });
});

export default router;
