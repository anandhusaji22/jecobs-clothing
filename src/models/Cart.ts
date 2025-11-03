import { Schema, models, model, Document } from "mongoose";

interface ICartItem {
  productId: string;
  productName: string;
  productImage: string;
  productDescription: string;
  quantity: number;
  size: string;
  material?: string;
  clothesProvided: 'yes' | 'no';
  specialNotes?: string;
  selectedDates: Date[];
  // Slot allocation data
  normalSlotsTotal: number;
  emergencySlotsTotal: number;
  basePrice: number;
  normalSlotsCost: number;
  emergencySlotsCost: number;
  emergencyCharges: number;
  totalPrice: number;
}

interface ICart extends Document {
  userId: string; // Firebase UID
  userFirebaseUid: string;
  items: ICartItem[];
  deliveryAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  productImage: { type: String, required: true },
  productDescription: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  size: { type: String, required: true },
  material: { type: String },
  clothesProvided: { type: String, enum: ['yes', 'no'], required: true },
  specialNotes: { type: String },
  selectedDates: [{ type: Date, required: true }],
  normalSlotsTotal: { type: Number, required: true, min: 0 },
  emergencySlotsTotal: { type: Number, required: true, min: 0 },
  basePrice: { type: Number, required: true },
  normalSlotsCost: { type: Number, required: true },
  emergencySlotsCost: { type: Number, required: true },
  emergencyCharges: { type: Number, required: true },
  totalPrice: { type: Number, required: true }
}, { _id: true });

const cartSchema = new Schema<ICart>({
  userId: { type: String, required: true },
  userFirebaseUid: { type: String, required: true },
  items: [cartItemSchema],
  deliveryAddress: { type: String },
}, {
  timestamps: true
});

// Create index for efficient queries
cartSchema.index({ userId: 1 });
cartSchema.index({ createdAt: -1 });

const Cart = models.Cart || model<ICart>('Cart', cartSchema);

export default Cart;
export type { ICart, ICartItem };
