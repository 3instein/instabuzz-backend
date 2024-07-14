import { Router } from "express";
import { createJob, deleteJob, getJobById, getJobs, updateJob, validateJobSubmissionLink } from "../controllers/jobController";

const router = Router();

router.post('/create', createJob)
router.get('/', getJobs);
router.get('/:id', getJobById);
router.put('/update', updateJob);
router.delete('/delete', deleteJob);
router.post('/validate', validateJobSubmissionLink);

export default router;