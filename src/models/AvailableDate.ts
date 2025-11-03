import { Schema, models, model, Document } from "mongoose";

interface IAvailableDate extends Document {
    date: Date;
    normalSlots: number;
    emergencySlots: number;
    emergencySlotCost: number;
    isAvailable: boolean;
    normalBookedSlots: number;
    emergencyBookedSlots: number;
    createdAt: Date;
    updatedAt: Date;
}

const availableDateSchema = new Schema<IAvailableDate>({
    date: { 
        type: Date, 
        required: true, 
        unique: true 
    },
    normalSlots: { 
        type: Number, 
        required: true, 
        min: 0,
        default: 4
    },
    emergencySlots: { 
        type: Number, 
        required: true, 
        min: 0,
        default: 1
    },
    emergencySlotCost: { 
        type: Number, 
        required: true, 
        min: 0,
        default: 0
    },
    isAvailable: { 
        type: Boolean, 
        default: true 
    },
    normalBookedSlots: { 
        type: Number, 
        default: 0, 
        min: 0 
    },
    emergencyBookedSlots: { 
        type: Number, 
        default: 0, 
        min: 0 
    }
}, {
    timestamps: true
});

// Index for faster queries (date index already created by unique constraint)
availableDateSchema.index({ isAvailable: 1, date: 1 });

// Virtual for remaining normal slots
availableDateSchema.virtual('remainingNormalSlots').get(function() {
    return this.normalSlots - this.normalBookedSlots;
});

// Virtual for remaining emergency slots
availableDateSchema.virtual('remainingEmergencySlots').get(function() {
    return this.emergencySlots - this.emergencyBookedSlots;
});

// Virtual for total slots
availableDateSchema.virtual('totalSlots').get(function() {
    return this.normalSlots + this.emergencySlots;
});

// Virtual for total booked slots
availableDateSchema.virtual('totalBookedSlots').get(function() {
    return this.normalBookedSlots + this.emergencyBookedSlots;
});

// Ensure virtuals are included in JSON
availableDateSchema.set('toJSON', { virtuals: true });

const AvailableDate = models.AvailableDate || model<IAvailableDate>('AvailableDate', availableDateSchema);

export default AvailableDate;
export type { IAvailableDate };