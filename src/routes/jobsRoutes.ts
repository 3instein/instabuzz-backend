import { Router } from "express";
import { createJob, deleteJob, getJobById, getCreatedJobs, joinJob, updateJob, validateJobSubmissionLink, getAssignedJobs } from "../controllers/jobController";

const router = Router();

router.post('/create', createJob)
router.get('/created', getCreatedJobs);
router.get('/assigned', getAssignedJobs)
router.get('/:id', getJobById);
router.put('/update', updateJob);
router.delete('/delete', deleteJob);
router.post('/validate', validateJobSubmissionLink);
router.get('/join/:id', joinJob);

export default router;