import { Request, Response, NextFunction } from 'express';

const addSuccessField = (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;

    res.json = function (body) {
        if (res.headersSent) {
            return originalJson.call(this, body);
        }

        const success = res.statusCode >= 200 && res.statusCode <= 304;

        if (typeof body === 'object') {
            body = { ...body, success };
        } else {
            body = { data: body, success };
        }

        return originalJson.call(this, body);
    };

    next();
};

export default addSuccessField;

