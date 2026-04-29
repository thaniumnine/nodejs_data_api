import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  display_name: z.string().min(1).max(120).optional()
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const RefreshSchema = z.object({
  refresh_token: z.string().min(32)
});

export type RefreshDto = z.infer<typeof RefreshSchema>;
