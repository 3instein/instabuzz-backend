import express from 'express';
import dotenv from 'dotenv';
import otpRoutes from './routes/otpRoutes';
import authRoutes from './routes/authRoutes';
import jobsRoutes from './routes/jobsRoutes';
import { authenticate, errorHandler } from './middlewares/auth';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/otp', otpRoutes);
app.use('/api/auth', authenticate, authRoutes);
app.use('/api/jobs', authenticate, jobsRoutes);
app.use(errorHandler);

// handle 404 error
app.use((req, res, next) => {
    res.status(404).json({ message: "Route Not Found" });
});

app.listen(3000, () =>
    console.log(`⚡️[server]: Server is running at https://localhost:3000`)
);
