import { z } from 'zod';

export const jobSchema = z.object({
    id: z.string().nullable(),
    title: z.string(),
    caption: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    keepDuration: z.number(),
    type: z.string(),
});