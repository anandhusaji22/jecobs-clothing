import { Schema , models , model ,Document } from "mongoose";

export interface IUser extends Document {
    email?: string;
    password?: string;
    name: string;
    phoneNumber?: string;
    googleId?: string;
    firebaseUid?: string; // Add Firebase UID for syncing
    avatar?: string;
    isPhoneVerified: boolean;
    authProvider: 'email' | 'google' | 'phone' ;
    role: 'customer' | 'admin';
    denomination: 'Orthodox & Jacobite' | 'Mar Thoma' | 'CSI' | '';
    // E-commerce specific fields
    addresses?: Array<{
        type: 'shipping' | 'billing';
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
        isDefault: boolean;
    }>;
    gender?: 'male' | 'female' | 'other';
    // OTP related fields
    phoneOTP?: string;
    phoneOTPExpiry?: Date;
    orders?: Schema.Types.ObjectId[]; // References to Order documents
    payments?: Schema.Types.ObjectId[]; // References to Payment documents
    
}

const addressSchema = new Schema({
    type: { 
        type: String, 
        enum: ['shipping', 'billing'], 
        required: true 
    },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    isDefault: { type: Boolean, default: false }
});

const userSchema = new Schema<IUser>({
    email: { 
        type: String, 
        sparse: true, // allows multiple null values but ensures uniqueness for non-null values
        unique: true, 
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'] 
    },
    password: { 
        type: String, 
        minLength: 8 
    },
    name: { 
        type: String, 
        required: true, 
        minLength: 2, 
        maxLength: 50 
    },
    phoneNumber: { 
        type: String, 
        sparse: true,
        unique: true, 
        match: [/^[+]?[\d\s-()]{10,15}$/, 'Please enter a valid phone number']
    },
    googleId: { 
        type: String, 
        sparse: true,
        unique: true 
    },
    firebaseUid: { 
        type: String, 
        sparse: true,
        unique: true 
    },
    avatar: { 
        type: String,
        default: null 
    },
    isPhoneVerified: { 
        type: Boolean, 
        default: false 
    },
    authProvider: { 
        type: String, 
        enum: ['email', 'google', 'phone', 'firebase'], 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['customer', 'admin'], 
        default: 'customer' 
    },
    denomination: { 
        type: String, 
        enum: ['Orthodox & Jacobite', 'Mar Thoma', 'CSI', ''], 
        default: '' 
    },
    addresses: [addressSchema],
    gender: { 
        type: String, 
        enum: ['male', 'female', 'other'] 
    },
    // OTP fields
    phoneOTP: { type: String },
    phoneOTPExpiry: { type: Date },
    orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
    payments: [{ type: Schema.Types.ObjectId, ref: 'Payment' }]
}, {
    timestamps: true // adds createdAt and updatedAt
})


const User = models.User || model<IUser>('User', userSchema);

export default User;