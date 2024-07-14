import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { createJob, deleteJob, getJobById, getJobs, updateJob, validateJobSubmissionLink } from "../controllers/jobController";

const router = Router();

router.post('/create', authenticate, createJob)
router.post('/create', authenticate, createJob);
router.get('/', authenticate, getJobs);
router.get('/:id', authenticate, getJobById);
router.put('/update', authenticate, updateJob);
router.delete('/delete', authenticate, deleteJob);
router.post('/validate', authenticate, validateJobSubmissionLink);

export default router;