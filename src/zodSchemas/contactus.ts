import {z} from "zod";


export const contactUsSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    message: z.string().min(5).max(1000),
    phoneNumber: z.string()
        .min(10, 'Phone number must be at least 10 digits')
        .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
        .optional()
});

export type ContactUs = z.infer<typeof contactUsSchema>;