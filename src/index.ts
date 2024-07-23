import express from 'express';
import dotenv from 'dotenv';
import otpRoutes from './routes/otpRoutes';
import authRoutes from './routes/authRoutes';
import jobsRoutes from './routes/jobsRoutes';
import { authenticate } from './middlewares/auth';
import addSuccessField from './middlewares/addSuccessField';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './errorHandler';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

app.use(addSuccessField);
app.use('/api/otp', otpRoutes);
app.use('/api/auth', authenticate, authRoutes);
app.use('/api/jobs', authenticate, jobsRoutes);
app.use('/uploads', express.static('src/uploads'));
app.use(errorHandler);

// handle 404 error
app.use((req, res, next) => {
    res.status(404).json({ message: "Route Not Found" });
});

app.listen(3000, 'localhost', () =>
    //check database connection
    prisma.$connect().then(() => {
        console.log(`⚡️[server]: Server is running at https://localhost:3000`);
    }).catch((error) => {
        console.error(`❌[server]: Error connecting to database: ${error.message}`);
    })
);
