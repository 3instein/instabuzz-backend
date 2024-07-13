import { expressjwt } from "express-jwt";
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from 'express-jwt';

const secret = 'm@klo123';

const authenticate = expressjwt({ secret: secret, algorithms: ['HS256'] });

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof UnauthorizedError) {
        // Handle JWT authentication errors
        return res.status(401).json({ message: 'Invalid token' });
    }

    // Handle other types of errors
    return res.status(500).json({ message: 'Internal server error' });
};

export { authenticate, errorHandler };
