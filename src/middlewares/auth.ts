import { expressjwt } from "express-jwt";
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from "@prisma/client";
import { decodeToken } from "../jwt";

const secret = 'm@klo123';

const authenticate = expressjwt({ secret: secret, algorithms: ['HS256'] });
const prisma = new PrismaClient()

// create existing user middleware
const existingUser = (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        if (token === 'Bearer') {
            return res.status(401).json({ message: 'Invalid token' });
        }

        const payload = decodeToken(req, res);

        if (!payload) {
            return res.status(401).json({ message: "Invalid token" });
        }

        const { id } = payload;

        const user = prisma.user.findUnique({
            where: {
                id: id
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        next();
    } else {
        return res.status(401).json({ message: 'No token provided' });
    }
};

export { authenticate, existingUser };
