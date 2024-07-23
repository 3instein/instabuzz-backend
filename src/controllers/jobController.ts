import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { jobSchema } from "../schemas/jobSchema";
import { decodeToken } from "../jwt";

const prisma = new PrismaClient();
const IG_BOT_URL = process.env.IG_BOT_URL || "http://localhost:5000";

export const createJob = async (req: Request, res: Response) => {
    try {
        // Parse keepDuration from string to number
        const { keepDuration, ...rest } = req.body;
        const parsedBody = {
            ...rest,
            keepDuration: parseInt(keepDuration, 10),
        };

        const parseResult = jobSchema.safeParse(parsedBody);

        if (!parseResult.success) {
            return res.status(400).json({ message: parseResult.error });
        }

        const { title, caption, startDate, endDate, type } = parsedBody;

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

        const { id: creatorId } = payload;

        const jobData: any = {
            title,
            caption,
            startDate,
            endDate,
            keepDuration: parsedBody.keepDuration,
            type,
            creatorId,
        };

        if (!req.file) {
            return res.status(400).json({ message: "Media is required" });
        }

        jobData.media = req.file.filename;

        const job = await prisma.job.create({
            data: jobData
        });

        res.status(200).json({ data: job });
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getCreatedJobs = async (req: Request, res: Response) => {
    const payload = decodeToken(req, res);

    if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const { id: creatorId } = payload

    const jobs = await prisma.job.findMany({
        where: { creatorId },
        include: {
            JobsUsers: {
                select: {
                    user: {
                        select: {
                            username: true
                        }
                    },
                    verified: true,
                    submissionTime: true
                }
            }
        }
    });

    if (jobs.length === 0) {
        return res.status(200).json({ message: "No jobs found" });
    }

    const transformedJobs = jobs.map(job => ({
        ...job,
        users: job.JobsUsers.map(jobsUser => ({
            ...jobsUser.user,
            submitted: jobsUser.submissionTime ? true : false,
            verified: jobsUser.verified,
            late: job.endDate > new Date(jobsUser.submissionTime) ? true : false
        })),
        JobsUsers: undefined // Remove the original JobsUsers field
    }));

    res.status(200).json({ data: transformedJobs });
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
        return res.status(200).json({ message: "No jobs found" });
    }

    const jobsData = await Promise.all(jobs.map(async (job) => {
        const jobData = await prisma.job.findUnique({
            where: { id: job.jobId },
            include: {
                JobsUsers: {
                    select: {
                        user: {
                            select: {
                                username: true
                            }
                        },
                        verified: true,
                        submissionTime: true
                    },
                    where: {
                        userId: userId
                    }
                }
            }
        });

        return jobData;
    }));

    const transformedJobs = jobsData.map(job => ({
        ...job,
        late: job!.endDate > new Date(job!.JobsUsers[0].submissionTime) ? true : false,
        JobsUsers: undefined // Remove the original JobsUsers field
    }));

    res.status(200).json({ data: transformedJobs });
}

export const getJobById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = decodeToken(req, res);

    if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const { id: userId } = payload

    const job = await prisma.job.findUnique({
        where: { id },
        include: {
            JobsUsers: {
                select: {
                    user: {
                        select: {
                            id: true,
                            username: true
                        }
                    },
                    verified: true,
                    submissionTime: true
                }
            }
        }
    });

    if (!job) {
        return res.status(404).json({ message: "Job not found" });
    }

    const usersId = job.JobsUsers.map(jobsUser => jobsUser.user.id);

    if (!usersId.includes(userId) && job.creatorId !== userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const transformedJob = {
        ...job,
        users: job.creatorId === userId ? job.JobsUsers.map(jobsUser => ({
            username: jobsUser.user.username,
            submitted: jobsUser.submissionTime ? true : false,
            verified: jobsUser.verified,
            late: job.endDate > new Date(jobsUser.submissionTime) ? true : false
        })) : undefined,
        JobsUsers: undefined // Remove the original JobsUsers field
    };

    res.status(200).json(transformedJob);
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

    res.status(200).json({ job: updatedJob });
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

    res.status(200).json({ message: "Job deleted" });
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

    const updatedJobUser = await prisma.jobUser.update({
        where: {
            id: joinedJob.id
        },
        data: {
            verified: true,
            submissionTime: botResponse.data.time
        }
    });

    if (!updatedJobUser) {
        return res.status(500).json({ message: "Failed to update job user" });
    }

    res.status(200).json({ message: "Submission link validated", });
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
            userId,
            submissionTime: ""
        }
    });

    if (jobUser) {
        res.status(200).json({ message: "User joined job" });
    }
}