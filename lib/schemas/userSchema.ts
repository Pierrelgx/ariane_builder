import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  image: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords don\'t match',
    path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Le mot de passe actuel est requis"),
  newPassword: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
  confirmNewPassword: z.string().min(6, "La confirmation est requise"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmNewPassword"],
})
