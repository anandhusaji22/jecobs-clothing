import { Schema, models, model, Document } from "mongoose";

interface IOTP extends Document {
    phone?: string;
    email?: string;
    otp: string;
    purpose: 'phone_verification' | 'login' | 'password_reset';
    expiresAt: Date;
    verified: boolean;
    attempts: number;
    maxAttempts: number;
    createdAt: Date;
}

const otpSchema = new Schema<IOTP>({
    phone: { 
        type: String, 
        required: false,
        match: [/^[+]?[\d\s-()]{10,15}$/, 'Please enter a valid phone number']
    },
    email: {
        type: String,
        required: false,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    otp: { 
        type: String, 
        required: true,
        length: 6 
    },
    purpose: { 
        type: String, 
        enum: ['phone_verification', 'login', 'password_reset'], 
        required: true 
    },
    expiresAt: { 
        type: Date, 
        required: true,
        default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    },
    verified: { 
        type: Boolean, 
        default: false 
    },
    attempts: { 
        type: Number, 
        default: 0 
    },
    maxAttempts: { 
        type: Number, 
        default: 3 
    }
}, {
    timestamps: true
});

// Create TTL index to auto-delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for faster queries
otpSchema.index({ phone: 1, purpose: 1 });
otpSchema.index({ email: 1, purpose: 1 });

const OTP = models.OTP || model<IOTP>('OTP', otpSchema);

export default OTP;
export type { IOTP };
