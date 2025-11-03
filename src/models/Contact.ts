import { Schema, models, model, Document } from "mongoose";

interface IContact extends Document {
    name: string;
    email: string;
    phoneNumber?: string;
    message: string;
    status: 'unread' | 'read' | 'replied';
    priority: 'low' | 'medium' | 'high';
    adminNotes?: string;
    repliedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const contactSchema = new Schema<IContact>({
    name: { 
        type: String, 
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    email: { 
        type: String, 
        required: true,
        lowercase: true,
        trim: true
    },
    phoneNumber: { 
        type: String, 
        trim: true,
        minlength: 10
    },
    message: { 
        type: String, 
        required: true,
        minlength: 5,
        maxlength: 1000
    },
    status: {
        type: String,
        enum: ['unread', 'read', 'replied'],
        default: 'unread'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    adminNotes: {
        type: String,
        maxlength: 500
    },
    repliedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for faster queries
contactSchema.index({ status: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ priority: 1 });

const Contact = models.Contact || model<IContact>("Contact", contactSchema);

export default Contact;
export type { IContact };