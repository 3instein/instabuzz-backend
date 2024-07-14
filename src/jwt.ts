import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

const secret = 'm@klo123'

type TokenPayload = {
    id: string;
    username: string;
};

export const generateToken = (id: string, username: string) => {
    return jwt.sign({ id, username }, secret, { expiresIn: '1h' });
};

export const decodeToken = (req: Request, res: Response): TokenPayload | null => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            res.status(401).json({ message: "Authorization header missing" });
            return null;
        }

        const payload = jwt.verify(token, secret) as TokenPayload;
        return payload;
    } catch (error) {
        return null;
    }
};