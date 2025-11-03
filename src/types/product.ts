import { Document } from 'mongoose';

interface IClothType {
    materials: Array<{
        name: string;
        additionalCost: number;
        isAvailable: boolean;
    }>;
}

interface IPricing {
    basePrice: number;
    clothProvidedDiscount: number;
    clothType: IClothType;
}

interface IProduct extends Document {
    name: string;
    description: string;
    pricing: IPricing;
    denomination: string;
    images: string[];
    showClothsProvided: boolean;
    colors: Array<{
        color: string;
        colorCode: string; // hex code
    }>;
    isActive: boolean;
    getDisplayPrice(): number;
    calculatePrice(material: string, clothProvided: boolean): number;
}

export type { IProduct, IPricing, IClothType };