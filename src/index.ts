import express from 'express';
import dotenv from 'dotenv';
import otpRoutes from './otpRoutes';
import authRoutes from './authRoutes';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api', otpRoutes);
app.use('/api', authRoutes);

// handle 404 error
app.use((req, res, next) => {
    res.status(404).json({ message: "Not Found" });
});

app.listen(3000, () =>
    console.log(`⚡️[server]: Server is running at https://localhost:3000`)
);
