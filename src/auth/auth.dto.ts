import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RegisterBodySchema = z
  .object({
    email: z.email(),
    password: z.string().min(6).max(100),
    name: z.string().min(1).max(100),
    confirmPassword: z.string().min(6).max(100),
    phoneNumber: z.string().min(10).max(15),
  })
  .strict()
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Password and confirm password must match`,
        path: ['confirmPassword'],
      });
    }
  });

export class RegisterBodyDTO extends createZodDto(RegisterBodySchema) {}
