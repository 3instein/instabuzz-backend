import { Router } from "express";
import { createJob, deleteJob, getJobById, getCreatedJobs, joinJob, updateJob, validateJobSubmissionLink, getAssignedJobs } from "../controllers/jobController";
import { upload } from "../storage";

const router = Router();

router.post('/create', upload.single('media'), createJob)
router.get('/created', getCreatedJobs);
router.get('/assigned', getAssignedJobs)
router.get('/:id', getJobById);
router.put('/update', updateJob);
router.delete('/delete', deleteJob);
router.post('/validate', validateJobSubmissionLink);
router.get('/join/:id', joinJob);

export default router;