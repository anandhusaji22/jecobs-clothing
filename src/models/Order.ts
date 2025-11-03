import { Schema, models, model, Document } from "mongoose";

interface ISlotAllocation {
    date: {
        _id: string;
        date: string;
        normalSlots: number;
        emergencySlots: number;
        isAvailable: boolean;
        normalBookedSlots: number;
        emergencyBookedSlots: number;
    };
    normalSlotsUsed: number;
    emergencySlotsUsed: number;
    totalSlotsUsed: number;
}

interface IPriceBreakdown {
    basePrice: number;
    normalSlotsCost: number;
    emergencySlotsCost: number;
    emergencyCharges: number;
}

interface IOrder extends Document {
    // Product details
    productId: string;
    productName: string;
    productImage: string;
    productDescription: string;
    
    // User details
    userId: string; // Firebase UID
    userFirebaseUid: string;
    
    // Order details
    quantity: number;
    totalPrice: number;
    size: string;
    material?: string;
    specialNotes?: string;
    clothesProvided: 'yes' | 'no';
    deliveryAddress?: string;
    
    // Slot allocation
    slotAllocation: ISlotAllocation[];
    normalSlotsTotal: number;
    emergencySlotsTotal: number;
    priceBreakdown: IPriceBreakdown;
    selectedDates: Date[];
    
    // Payment details
    paymentMethodId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
    paymentCompletedAt?: Date;
    
    // Order status
    status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
    
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

const slotAllocationSchema = new Schema({
    date: {
        _id: { type: String, required: true },
        date: { type: String, required: true },
        normalSlots: { type: Number, required: true },
        emergencySlots: { type: Number, required: true },
        isAvailable: { type: Boolean, required: true },
        normalBookedSlots: { type: Number, required: true },
        emergencyBookedSlots: { type: Number, required: true }
    },
    normalSlotsUsed: { type: Number, required: true, min: 0 },
    emergencySlotsUsed: { type: Number, required: true, min: 0 },
    totalSlotsUsed: { type: Number, required: true, min: 0 }
}, { _id: false });

const priceBreakdownSchema = new Schema({
    basePrice: { type: Number, required: true, min: 0 },
    normalSlotsCost: { type: Number, required: true, min: 0 },
    emergencySlotsCost: { type: Number, required: true, min: 0 },
    emergencyCharges: { type: Number, required: true, min: 0 }
}, { _id: false });

const orderSchema = new Schema<IOrder>({
    // Product details
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    productImage: { type: String, required: true },
    productDescription: { type: String, required: true },
    
    // User details
    userId: { type: String, required: true }, // Firebase UID
    userFirebaseUid: { type: String, required: true },
    
    // Order details
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    size: { type: String, required: true },
    material: { type: String },
    specialNotes: { type: String },
    clothesProvided: { type: String, enum: ['yes', 'no'], required: true },
    deliveryAddress: { type: String },
    
    // Slot allocation
    slotAllocation: [slotAllocationSchema],
    normalSlotsTotal: { type: Number, required: true, min: 0 },
    emergencySlotsTotal: { type: Number, required: true, min: 0 },
    priceBreakdown: { type: priceBreakdownSchema, required: true },
    selectedDates: [{ type: Date, required: true }],
    
    // Payment details
    paymentMethodId: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paymentStatus: { 
        type: String, 
        enum: ['pending', 'completed', 'failed', 'refunded'], 
        default: 'pending' 
    },
    paymentCompletedAt: { type: Date },
    
    // Order status
    status: { 
        type: String, 
        enum: ['pending', 'confirmed', 'processing', 'completed', 'cancelled'], 
        default: 'pending' 
    },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const Order = models.Order || model<IOrder>('Order', orderSchema);

export default Order;
export type { IOrder, ISlotAllocation, IPriceBreakdown };
