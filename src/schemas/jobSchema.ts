import { z } from 'zod';

export const jobSchema = z.object({
    title: z.string(),
    caption: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    keepDuration: z.number(),
    type: z.string(),
});