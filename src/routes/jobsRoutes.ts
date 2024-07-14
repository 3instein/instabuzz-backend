import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import axios from "axios";
import { decodeToken } from "../jwt";
import { PrismaClient } from "@prisma/client";
import { jobSchema } from "../schemas/jobSchema";

const router = Router();
const prisma = new PrismaClient();
const IG_BOT_URL = process.env.IG_BOT_URL || "http://localhost:5000";

router.post('/create', authenticate, async (req, res) => {

    const parseResult = jobSchema.safeParse(req.body);

    if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error });
    }

    const { title, caption, startDate, endDate, keepDuration, type } = req.body

    if (new Date(startDate) < new Date()) {
        return res.status(400).json({ message: "Start date cannot be in the past" });
    }

    if (new Date(endDate) < new Date()) {
        return res.status(400).json({ message: "End date cannot be in the past" });
    }

    if (new Date(endDate) < new Date(startDate)) {
        return res.status(400).json({ message: "End date cannot be before start date" });
    }

    if (typeof keepDuration !== 'number') {
        return res.status(400).json({ message: "Keep duration must be a number" });
    }

    const token = req.headers.authorization!.split(' ')[1];
    const payload = decodeToken(token);

    if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const { id } = payload;

    // create job using prisma
    const job = await prisma.job.create({
        data: {
            title,
            caption,
            startDate,
            endDate,
            keepDuration,
            type,
            userId: id
        }
    });

    const response = {
        message: "Job created",
        job
    }

    return res.json(response);
});

router.post('/validate', authenticate, async (req, res) => {
    const { link } = req.body;

    if (!link) {
        return res.status(400).json({ message: "Link is required" });
    }

    const token = req.headers.authorization!.split(' ')[1];
    const payload = decodeToken(token);

    if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const { id, username } = payload;

    const botResponse = await axios.post(`${IG_BOT_URL}/validate`, { link });

    if (botResponse.data.username !== username) {
        // return invalid user
        return res.status(401).json({ message: "Invalid user" });
    }

    return res.json(botResponse.data);
});

export default router;