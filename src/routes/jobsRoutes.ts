import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import axios from "axios";
import { getUsernameFromToken } from "../jwt";

const router = Router();
const IG_BOT_URL = process.env.IG_BOT_URL || "http://localhost:5000";

router.post('/validate', authenticate, async (req, res) => {
    const { link } = req.body;

    if (!link) {
        return res.status(400).json({ message: "Link is required" });
    }

    const token = req.headers.authorization!.split(' ')[1];
    const username = getUsernameFromToken(token);

    const botResponse = await axios.post(`${IG_BOT_URL}/validate`, { link });

    if(botResponse.data.username !== username) {
        // return invalid user
        return res.status(401).json({ message: "Invalid user" });
    }

    return res.json(botResponse.data);
});

export default router;