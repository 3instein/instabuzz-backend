import { Router, Request, Response } from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { generateToken } from './jwt';

const router = Router();
const prisma = new PrismaClient();

const otp_server = process.env.OTP_SERVER || "http://localhost:5000";

router.get("/send-otp/:username", async (req: Request, res: Response) => {
    const { username } = req.params;

    const response = await axios.post(`${otp_server}/send-otp`, { username });

    if (response.status === 200) {
        const otp = response.data.otp;

        const existingUser = await prisma.user.findUnique({
            where: { username }
        });

        if (existingUser) {
            await prisma.user.update({
                where: { username },
                data: { otp }
            });
        } else {
            await prisma.user.create({
                data: { username, otp }
            });
        }

        return res.json({ message: "OTP sent", otp });
    }

    return res.json({ message: "Failed to send OTP" });
});

router.post("/verify-otp", async (req: Request, res: Response) => {
    const { username, otp } = req.body;

    const user = await prisma.user.findUnique({
        where: { username }
    });

    if (!user) {
        return res.json({ message: "User not found" });
    }

    if (!user.otp) {
        return res.json({ message: "OTP not sent" });
    }

    if (user.otp === otp) {
        await prisma.user.update({
            where: { username },
            data: { otp: null, verified: true }
        });

        const token = generateToken(username);
        return res.json({ message: 'OTP verified', token });
    }

    return res.json({ message: "Wrong OTP" });
});

export default router;