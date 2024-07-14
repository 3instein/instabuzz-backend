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

router.get('/', authenticate, async (req, res) => {
    const token = req.headers.authorization!.split(' ')[1];
    const payload = decodeToken(token);

    if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const { id } = payload;

    const jobs = await prisma.job.findMany({
        where: { userId: id }
    });

    if(jobs.length === 0) {
        return res.json({ message: "No jobs found" });
    }

    return res.json(jobs);
});

router.get('/:id', authenticate, async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Job ID is required" });
    }

    const token = req.headers.authorization!.split(' ')[1];
    const payload = decodeToken(token);

    if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const { id: userId } = payload;

    const job = await prisma.job.findUnique({
        where: {
            id: id,
            userId: userId
        }
    });

    if (!job) {
        return res.status(404).json({ message: "Job not found" });
    }

    if (job.userId !== userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    return res.json(job);
});

router.put('/update', authenticate, async (req, res) => {
    const parseResult = jobSchema.safeParse(req.body);

    if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error });
    }

    const { id, title, caption, startDate, endDate, keepDuration, type } = req.body;

    if (!id) {
        return res.status(400).json({ message: "Job ID is required" });
    }

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

    const { id: userId } = payload;

    const job = await prisma.job.findUnique({
        where: { id: id }
    });

    if (!job) {
        return res.status(404).json({ message: "Job not found" });
    }

    if (job.userId !== userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const updatedJob = await prisma.job.update({
        where: { id: id },
        data: {
            title,
            caption,
            startDate,
            endDate,
            keepDuration,
            type
        }
    });

    return res.json({ message: "Job updated", job: updatedJob });
});

router.delete('/delete', authenticate, async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: "Job ID is required" });
    }

    const token = req.headers.authorization!.split(' ')[1];
    const payload = decodeToken(token);

    if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const { id: userId } = payload;

    const job = await prisma.job.findUnique({
        where: { id: id }
    });

    if (!job) {
        return res.status(404).json({ message: "Job not found" });
    }

    if (job.userId !== userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    await prisma.job.delete({
        where: { id: id }
    });

    return res.json({ message: "Job deleted" });
})

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