import { z } from 'zod';

const createProductZodSchema = z.object({
  body: z.object({
    name: z.string({ message: 'Product name is required' }),
    description: z.string({ message: 'Description is required' }),
    price: z.string({ message: 'Price is required' }), // Multipart-form data usually comes as strings
    discount: z.string().optional(),
    status: z.enum(['in stock', 'stock out']).optional(),
    category: z.string({ message: 'Category ID is required' }),
  }),
});

/**
 * Step 5: Update Validation
 * Strictly limits updates to status, description, and discount only.
 */
const updateProductZodSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        // Transform string numbers from form-data back into actual numbers
        price: z.preprocess((val) => (val ? Number(val) : undefined), z.number().optional()),
        discount: z.preprocess((val) => (val ? Number(val) : undefined), z.number().optional()),
        status: z.enum(['in stock', 'stock out']).optional(),
        category: z.string().optional(),
    }),
});

export const ProductValidation = {
  createProductZodSchema,
  updateProductZodSchema,
};