import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { jobSchema } from "../schemas/jobSchema";
import { decodeToken } from "../jwt";

const prisma = new PrismaClient();
const IG_BOT_URL = process.env.IG_BOT_URL || "http://localhost:5000";

export const createJob = async (req: Request, res: Response) => {
    const parseResult = jobSchema.safeParse(req.body);

    if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error });
    }

    const { title, caption, startDate, endDate, keepDuration, type } = req.body;

    if (new Date(startDate) < new Date()) {
        return res.status(400).json({ message: "Start date cannot be in the past" });
    }

    if (new Date(endDate) < new Date()) {
        return res.status(400).json({ message: "End date cannot be in the past" });
    }

    if (new Date(endDate) < new Date(startDate)) {
        return res.status(400).json({ message: "End date cannot be before start date" });
    }

    const payload = decodeToken(req, res);

    if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const { id: creatorId } = payload

    const job = await prisma.job.create({
        data: {
            title,
            caption,
            startDate,
            endDate,
            keepDuration,
            type,
            creatorId
        }
    });

    res.json({ message: "Job created", job });
};

export const getCreatedJobs = async (req: Request, res: Response) => {
    const payload = decodeToken(req, res);

    if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const { id: creatorId } = payload

    const jobs = await prisma.job.findMany({
        where: { creatorId }
    });

    if (jobs.length === 0) {
        return res.json({ message: "No jobs found" });
    }

    res.json(jobs);
};

export const getAssignedJobs = async (req: Request, res: Response) => {
    const payload = decodeToken(req, res);

    if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const { id: userId } = payload

    const jobs = await prisma.jobUser.findMany({
        where: { userId }
    });

    if (jobs.length === 0) {
        return res.json({ message: "No jobs found" });
    }

    const jobsData = await Promise.all(jobs.map(async (job) => {
        const jobData = await prisma.job.findUnique({
            where: { id: job.jobId }
        });

        return jobData;
    }));

    res.json(jobsData);
}

export const getJobById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = decodeToken(req, res);

    if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const { id: creatorId } = payload

    const job = await prisma.job.findUnique({
        where: { id }
    });

    if (!job) {
        return res.status(404).json({ message: "Job not found" });
    }

    if (job.creatorId !== creatorId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    res.json(job);
};

export const updateJob = async (req: Request, res: Response) => {
    const parseResult = jobSchema.safeParse(req.body);

    if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error });
    }

    const { id, title, caption, startDate, endDate, keepDuration, type } = req.body;
    const payload = decodeToken(req, res);

    if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const { id: creatorId } = payload

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

    const job = await prisma.job.findUnique({
        where: { id }
    });

    if (!job) {
        return res.status(404).json({ message: "Job not found" });
    }

    if (job.creatorId !== creatorId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const updatedJob = await prisma.job.update({
        where: { id },
        data: {
            title,
            caption,
            startDate,
            endDate,
            keepDuration,
            type
        }
    });

    res.json({ message: "Job updated", job: updatedJob });
};

export const deleteJob = async (req: Request, res: Response) => {
    const { id } = req.body;
    const payload = decodeToken(req, res);

    if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const { id: creatorId } = payload

    if (!id) {
        return res.status(400).json({ message: "Job ID is required" });
    }

    const job = await prisma.job.findUnique({
        where: { id }
    });

    if (!job) {
        return res.status(404).json({ message: "Job not found" });
    }

    if (job.creatorId !== creatorId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    await prisma.job.delete({
        where: { id }
    });

    res.json({ message: "Job deleted" });
};

export const validateJobSubmissionLink = async (req: Request, res: Response) => {
    const { link, jobId } = req.body;
    const payload = decodeToken(req, res);

    if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const { username } = payload

    if (!link) {
        return res.status(400).json({ message: "Link is required" });
    }

    if (!jobId) {
        return res.status(400).json({ message: "Job ID is required" });
    }

    const job = await prisma.job.findUnique({
        where: { id: jobId }
    });

    if (!job) {
        return res.status(404).json({ message: "Job not found" });
    }

    const joinedJob = await prisma.jobUser.findFirst({
        where: { jobId, userId: payload.id }
    });

    if (!joinedJob) {
        return res.status(401).json({ message: "User has not joined job" });
    }

    if (joinedJob.verified) {
        return res.status(400).json({ message: "Submission already verified" });
    }

    const botResponse = await axios.post(`${IG_BOT_URL}/validate`, { link });

    if (botResponse.data.username !== username) {
        return res.status(401).json({ message: "Invalid user" });
    }

    if (botResponse.data.caption !== job.caption) {
        return res.status(401).json({ message: "Invalid caption" });
    }

    if (new Date(botResponse.data.time) < new Date(job.startDate)) {
        return res.status(401).json({ message: "Submission time is before start date" });
    }

    if (new Date(botResponse.data.time) > new Date(job.endDate)) {
        return res.status(401).json({ message: "Submission time is after end date" });
    }

    const updatedJobUser = await prisma.jobUser.update({
        where: {
            id: joinedJob.id
        },
        data: {
            verified: true
        }
    });

    if(!updatedJobUser) {
        return res.status(500).json({ message: "Failed to update job user" });
    }

    res.json({
        message: "Submission link validated",
    });
};

export const joinJob = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Job ID is required" });
    }

    const payload = decodeToken(req, res);

    if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const { id: userId } = payload;

    const job = await prisma.job.findUnique({
        where: { id }
    });

    if (!job) {
        return res.status(404).json({ message: "Job not found" });
    }

    if (job.creatorId === userId) {
        return res.status(400).json({ message: "Creator cannot join job they created" });
    }

    const existingJobUser = await prisma.jobUser.findFirst({
        where: { jobId: job.id, userId }
    });

    if (existingJobUser) {
        return res.status(400).json({ message: "User already joined job" });
    }

    const jobUser = await prisma.jobUser.create({
        data: {
            jobId: job.id,
            userId
        }
    });

    if (jobUser) {
        res.json({ message: "User joined job" });
    }
}