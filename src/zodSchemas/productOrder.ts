import { z } from "zod";

export const productOrderSchema = z.object({
  size: z.string().min(1, "Please select a size"), 
  material: z.string().optional(),
  specialNotes: z.string().optional(),
  availableDate: z.date(),
  additionalDates: z.array(z.date()).optional(),
  quantity: z.number().min(1, "Quantity must be at least 1").max(10, "Maximum quantity is 10"),
  clothesProvided: z.enum(["yes", "no"]).optional(),
}).refine((data) => {
  // Material is required when clothesProvided is "no"
  if (data.clothesProvided === "no" && (!data.material || data.material.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Please select a material when clothes are not provided",
  path: ["material"]
});

export type ProductOrder = z.infer<typeof productOrderSchema>;