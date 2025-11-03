import { z } from "zod"

const materialSchema = z.object({
  name: z.string().min(1, "Material name is required"),
  additionalCost: z.number().min(0, "Additional cost must be 0 or greater"),
  isAvailable: z.boolean()
})

const clothTypeSchema = z.object({
  materials: z.array(materialSchema).min(1, "At least one material is required")
})

const pricingSchema = z.object({
  basePrice: z.number().min(0.01, "Base price must be greater than 0"),
  clothProvidedDiscount: z.number().min(0, "Discount must be 0 or greater"),
  clothType: clothTypeSchema
})

export const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required").trim(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  pricing: pricingSchema,
  denomination: z.string().min(1, "Denomination is required"),
  images: z.array(z.any()).optional(),
  showClothsProvided: z.boolean(), // Toggle for cloths provided option
  colors: z.array(z.object({
    color: z.string().min(1, "Color name is required"),
    colorCode: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color code")
  })).min(1, "At least one color is required"),
  isActive: z.boolean()
})

export type ProductFormData = z.infer<typeof productFormSchema>