import jwt from 'jsonwebtoken';

const secret = 'm@klo123'

type TokenPayload = {
    id: string;
    username: string;
};

export const generateToken = (id: string, username: string) => {
    return jwt.sign({ id, username }, secret, { expiresIn: '1h' });
};

export const decodeToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, secret) as TokenPayload;
    } catch (err) {
        console.error('Invalid token', err);
        return null;
    }
}