import { Schema, models, model, Document } from "mongoose";

export interface ISavedPayment extends Document {
  userId: string; // Firebase UID
  userFirebaseUid: string;
  
  // Payment method type
  type: 'card' | 'upi' | 'netbanking' | 'wallet';
  
  // Payment details (masked for security)
  cardLast4?: string; // Last 4 digits of card
  cardBrand?: string; // Visa, Mastercard, etc.
  cardNetwork?: string; // Credit/Debit
  
  upiId?: string; // UPI ID (e.g., user@paytm)
  
  bankName?: string; // For netbanking
  
  walletName?: string; // Paytm, PhonePe, etc.
  
  // Display name for user
  displayName: string; // e.g., "Visa •••• 4242", "UPI: user@paytm"
  
  // Metadata
  isDefault: boolean;
  lastUsedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const savedPaymentSchema = new Schema<ISavedPayment>({
  userId: { type: String, required: true },
  userFirebaseUid: { type: String, required: true },
  
  type: { 
    type: String, 
    enum: ['card', 'upi', 'netbanking', 'wallet'],
    required: true 
  },
  
  // Card details
  cardLast4: { type: String },
  cardBrand: { type: String },
  cardNetwork: { type: String },
  
  // UPI details
  upiId: { type: String },
  
  // Netbanking details
  bankName: { type: String },
  
  // Wallet details
  walletName: { type: String },
  
  // Display
  displayName: { type: String, required: true },
  
  // Metadata
  isDefault: { type: Boolean, default: false },
  lastUsedAt: { type: Date },
}, {
  timestamps: true
});

// Create indexes
savedPaymentSchema.index({ userId: 1, isDefault: -1 });
savedPaymentSchema.index({ createdAt: -1 });

const SavedPayment = models.SavedPayment || model<ISavedPayment>('SavedPayment', savedPaymentSchema);

export default SavedPayment;
