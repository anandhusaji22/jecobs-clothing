import { Schema, models, model, Document } from "mongoose";

interface IClothType {
    materials: Array<{
        name: string; // e.g., "Cotton", "Silk", "Wool"
        additionalCost: number; // additional cost for this material
        isAvailable: boolean;
    }>;
}

interface IPricing {
    basePrice: number; // base price for the garment
    clothProvidedDiscount: number; // discount when customer provides cloth (percentage or fixed amount)
    clothType: IClothType;
}

interface IProduct extends Document {
    name: string;
    description: string;
    pricing: IPricing;
    denomination: string;
    images: string[];
    showClothsProvided: boolean; // Toggle for showing cloths provided option
    colors: Array<{
        color: string;
        colorCode: string; // hex code
    }>;
    isActive: boolean;
    
    // Computed field for display price (lowest price option)
    getDisplayPrice(): number;
    // Method to calculate price based on selections
    calculatePrice(material: string, clothProvided: boolean): number;
}



const colorSchema = new Schema({
    color: { type: String, required: true },
    colorCode: { type: String, required: true, match: /^#[0-9A-F]{6}$/i },
});





const pricingSchema = new Schema({
    basePrice: { type: Number, required: true, min: 0 },
    clothProvidedDiscount: { type: Number, required: true, default: 0 },
    clothType: {
        materials: [{
            name: { type: String, required: true },
            additionalCost: { type: Number, required: true, default: 0 },
            isAvailable: { type: Boolean, default: true },
            _id: false
        }],
        _id: false
    }
}, { _id: false });

const productSchema = new Schema<IProduct>({
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    pricing: { type: pricingSchema, required: true },
    denomination: { type: String, required: true },
    images: [{ type: String, required: true }],
    showClothsProvided: { type: Boolean, default: true }, // Toggle for cloths provided option
    colors: [colorSchema],
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true
});

// Add methods to calculate pricing
productSchema.methods.getDisplayPrice = function(): number {
    if (!this.pricing || !this.pricing.clothType) {
        return this.pricing?.basePrice || 0;
    }
    
    // Find the minimum price from available materials
    let minPrice = this.pricing.basePrice;
    
    if (this.pricing.clothType.materials.length > 0) {
        const materialCosts = this.pricing.clothType.materials.map((material: { additionalCost: number }) => material.additionalCost);
        const minMaterialCost = materialCosts.length > 0 ? Math.min(...materialCosts) : 0;
        minPrice = this.pricing.basePrice + minMaterialCost;
    }
    
    return minPrice;
};

productSchema.methods.calculatePrice = function(materialName: string, clothProvided: boolean): number {
    if (!this.pricing) return 0;
    
    let finalPrice = this.pricing.basePrice;
    
    if (clothProvided) {
        // Apply discount when customer provides cloth
        if (this.pricing.clothProvidedDiscount > 0) {
            if (this.pricing.clothProvidedDiscount <= 1) {
                // Percentage discount
                finalPrice = finalPrice * (1 - this.pricing.clothProvidedDiscount);
            } else {
                // Fixed amount discount
                finalPrice = Math.max(0, finalPrice - this.pricing.clothProvidedDiscount);
            }
        }
    } else {
        // Customer wants us to provide cloth - calculate based on material
        if (this.pricing.clothType && this.pricing.clothType.materials) {
            const material = this.pricing.clothType.materials.find((m: { name: string }) => m.name === materialName);
            if (material) {
                finalPrice += material.additionalCost;
            }
        }
    }
    
    return Math.round(finalPrice * 100) / 100; // Round to 2 decimal places
};

// Index for search functionality
productSchema.index({ 
    name: 'text', 
    description: 'text', 
    denomination: 'text',

});

// Index for filtering
productSchema.index({ denomination: 1, 'pricing.basePrice': 1 });


const Product = models.Product || model<IProduct>('Product', productSchema);

export default Product;
export type { IProduct };
