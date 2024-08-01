import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { Request, Response } from 'express';
import { generateToken } from '../jwt';

const prisma = new PrismaClient();
const IG_BOT_URL = process.env.IG_BOT_URL || "http://localhost:5000";

export const sendOtp = async (req: Request, res: Response) => {
    const { username } = req.params;

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (!username) {
        return res.status(400).json({ message: "Username is required" });
    }

    const existingUser = await prisma.user.findUnique({
        where: { username }
    });

    if (existingUser) {
        await prisma.user.update({
            where: { username },
            data: { otp, otpTime: new Date() }
        });
    } else {
        await prisma.user.create({
            data: { username, otp, otpTime: new Date() }
        });
    }

    try {
        const response = await axios.post(`${IG_BOT_URL}/send-otp`, { username, otp });

        if (response.status === 200) {


            return res.status(200).json({ message: "OTP sent" });
        }

        return res.status(response.status).json({ message: "Failed to send OTP" });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ message: "An error occurred", error: error.message });
    }
}

export const verifyOtp = async (req: Request, res: Response) => {
    const { username, otp } = req.body;

    if (!username || !otp) {
        return res.status(400).json({ message: "Username and OTP are required" });
    }

    const user = await prisma.user.findUnique({
        where: { username }
    });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (!user.otp) {
        return res.status(400).json({ message: "OTP not sent" });
    }

    if (user.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
    }

    const otpTime = new Date(user.otpTime);

    // Check if OTP is expired 5 minutes after it was sent
    if (new Date().getTime() - otpTime.getTime() > 5 * 60 * 1000) {
        return res.status(400).json({ message: "OTP expired" });
    }

    await prisma.user.update({
        where: { username },
        data: { otp: null, verified: true }
    });

    const token = generateToken(user.id, username);

    return res.status(200).json({ message: "OTP verified", token });
}