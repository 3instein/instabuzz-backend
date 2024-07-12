import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import createError from "http-errors"
import dotenv from 'dotenv';
import axios from 'axios';
import { expressjwt } from 'express-jwt';
import bcrypt from 'bcrypt';
import { generateToken, verifyToken } from './jwt'

dotenv.config();

const secret = 'm@klo123'

const authenticate = expressjwt({ secret: secret, algorithms: ['HS256'] });
const prisma = new PrismaClient()
const app = express()

app.use(express.json())

const otp_server = process.env.OTP_SERVER || "http://localhost:5000"

// handle 404 error
// app.use((req: Request, res: Response, next: Function) => {
//     next(createError(404))
// })

app.listen(3000, () =>
    console.log(`⚡️[server]: Server is running at https://localhost:3000`)
)

app.get("/send-otp/:username", async (req: Request, res: Response) => {
    // hit the OTP server with username in the POST body using axios
    const { username } = req.params

    const response = await axios.post(`${otp_server}/send-otp`, { username })

    if (response.status === 200) {
        const otp = response.data.otp

        const existingUser = await prisma.user.findUnique({
            where: {
                username
            }
        })

        if (existingUser) {
            // update the user in the database
            await prisma.user.update({
                where: {
                    username
                },
                data: {
                    otp
                }
            })
        } else {
            const user = await prisma.user.create({
                data: {
                    username,
                    otp
                }
            })
        }

        // create the user in the database

        return res.json(
            {
                message: "OTP sent",
                otp: otp
            }
        )

    }

    return res.json(
        {
            message: "Failed to send OTP"
        }
    )
})

app.post("/verify-otp", async (req: Request, res: Response) => {
    const { username, otp } = req.body

    const user = await prisma.user.findUnique({
        where: {
            username
        }
    })

    if (!user) {
        return res.json({
            message: "User not found"
        })
    }

    if (!user.otp) {
        return res.json({
            message: "OTP not sent"
        })
    }

    if (user.otp === otp) {

        // update the user in the database
        await prisma.user.update({
            where: {
                username
            },
            data: {
                otp: null,
                verified: true
            }
        })

        const token = generateToken(username);
        return res.json(
            {
                message: 'OTP verified',
                token
            }
        );
    }

    return res.json({
        message: "Wrong OTP"
    })
})

// Example of a protected route
app.get('/protected', authenticate, (req: Request, res: Response) => {
    return res.json({ message: 'This is a protected route' });
});