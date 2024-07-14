import { Router } from 'express';
import { sendOtp, verifyOtp } from '../controllers/otpController';

const router = Router();

router.get("/send-otp/:username", sendOtp);
router.post("/verify-otp", verifyOtp);

export default router;
