import { BadRequestException } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';
import { ZodError } from 'zod';

export const CustomZodValidationPipe = createZodValidationPipe({
  createValidationException: (error: unknown) => {
    if (error instanceof ZodError) {
      const issues = error.issues.map((e) => ({
        ...e,
        path: e.path.join('.'),
      }));

      return new BadRequestException({
        message: 'Validation failed',
        errors: issues,
      });
    }
    return new BadRequestException('Ooops');
  },
});
