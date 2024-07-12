import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import createError from "http-errors"

const prisma = new PrismaClient()
const app = express()

app.use(express.json())

const otp_server = "http://localhost:5000"


// TODO: Routing aplikasi akan kita tulis di sini


// handle 404 error
// app.use((req: Request, res: Response, next: Function) => {
//     next(createError(404))
// })

app.listen(3000, () =>
    console.log(`⚡️[server]: Server is running at https://localhost:3000`)
)

app.get("/send-otp/:username", async (req: Request, res: Response) => {
    // hit the OTP server with username in the POST body
    const username = req.params.username
    const response = await fetch(`${otp_server}/send-otp`, {
        method: "POST",
        body: JSON.stringify({ username }),
        headers: { "Content-Type": "application/json" },
    })

    const data = await response.json()

    res.json(data)
})