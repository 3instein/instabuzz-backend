import { Router, Request, Response } from 'express';
import { authenticate } from '../middlewares/auth';
import { decodeToken } from '../jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

router.get('/get-user', authenticate, (req: Request, res: Response) => {

    const payload = decodeToken(req, res);

    if (!payload) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    const user = prisma.user.findUnique({
        where: {
            id: payload.id
        }
    });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
        id: payload.id,
        username: payload.username
    })
});

export default router;