import { z } from 'zod';
/**
 * 验证请求数据
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join('; ');
        throw new Error(`VALIDATION_ERROR: ${message}`);
      }
      throw error;
    }
  }
  