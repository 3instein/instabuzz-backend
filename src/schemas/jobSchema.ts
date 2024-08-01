import { z } from 'zod';

export const jobSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, { message: "Cannot be empty" }),
    caption: z.string().min(1, { message: "Cannot be empty" }),
    startDate: z.string(),
    endDate: z.string(),
    keepDuration: z.number(),
    type: z.string(),
    media: z.string().optional()
});