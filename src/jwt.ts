import jwt from 'jsonwebtoken';

const secret = 'm@klo123'

export const generateToken = (username: string) => {
    return jwt.sign({ username }, secret, { expiresIn: '1h' });
};

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, secret);
    } catch (err) {
        return null;
    }
};