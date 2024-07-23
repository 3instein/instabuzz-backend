import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from 'express-jwt';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof UnauthorizedError) {
        // Handle JWT authentication errors
        return res.status(401).json({ message: 'Invalid token' });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).send({ message: `${err.field} is an ${err.message.toLowerCase()}` });
    }

    // Handle other types of errors
    return res.status(500).json({ message: 'Internal server error' });
};

export { errorHandler };