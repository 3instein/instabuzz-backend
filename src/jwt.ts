import jwt from 'jsonwebtoken';

const secret = 'm@klo123'

export const generateToken = (username: string) => {
    return jwt.sign({ username }, secret, { expiresIn: '1h' });
};

export const getUsernameFromToken = (token: string): string | null => {
    try {
        const decodedToken = jwt.verify(token, secret) as { username: string };
        return decodedToken.username;
    } catch (err) {
        console.error('Invalid token', err);
        return null;
    }
};