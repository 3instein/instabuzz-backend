import { Router, Request, Response } from 'express';
import { authenticate } from '../middlewares/auth';
import { decodeToken } from '../jwt';

const router = Router();

router.get('/get-user', (req: Request, res: Response) => {

    const payload = decodeToken(req, res);

    if (!payload) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    return res.json({
        id: payload.id,
        username: payload.username
    })
});

export default router;