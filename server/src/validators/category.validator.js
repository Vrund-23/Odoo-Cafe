import { z } from 'zod';

export const createCategoryValidator = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color code').optional().default('#000000'),
});

export const updateCategoryValidator = z.object({
  name: z.string().min(2).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color code').optional(),
});
