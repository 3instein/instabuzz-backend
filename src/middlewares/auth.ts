import { expressjwt } from "express-jwt";

const secret = 'm@klo123';

const authenticate = expressjwt({ secret: secret, algorithms: ['HS256'] });

export { authenticate };
