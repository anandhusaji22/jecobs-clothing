import {z} from "zod";

export const userSignupSchema = z.object({
    name: z.string().min(2, "Name should be at least 2 characters long"),
    email: z.email("Invalid email address"),
    phoneNumber: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .transform((val) => val.replace(/\D/g, '')), // Remove non-digits for storage
    denomination: z.enum(["Orthodox & Jacobite", "Mar Thoma", "CSI", ""]),
    password: z.string()
        .min(8, "Password should be at least 8 characters long")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(8, "Confirm Password should be at least 8 characters long"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type UserSignup = z.infer<typeof userSignupSchema>;