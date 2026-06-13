import { z } from 'zod';

export const createProductValidator = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  categoryId: z.string().uuid('Invalid category ID'),
  price: z.number().positive('Price must be positive'),
  unitOfMeasure: z.string().optional().default('piece'),
  tax: z.number().min(0).optional().default(0),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  showInKds: z.boolean().optional().default(false),
});

export const updateProductValidator = z.object({
  name: z.string().min(2).optional(),
  categoryId: z.string().uuid().optional(),
  price: z.number().positive().optional(),
  unitOfMeasure: z.string().optional(),
  tax: z.number().min(0).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  showInKds: z.boolean().optional(),
});
