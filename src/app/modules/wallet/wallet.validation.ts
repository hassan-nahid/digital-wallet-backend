import { z } from "zod";
import mongoose from "mongoose";
import { Role } from "../user/user.interface";

export const createWalletZodSchema = z.object({
  body: z.object({
    userId: z
      .string()
      .refine(val => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid userId format",
      }),
    balance: z.number().min(0).optional(),
    currency: z.string().default("USD").optional(),
    isBlocked: z.boolean().optional(),
  }),
});

export const updateWalletZodSchema = z.object({
  body: z.object({
    userId: z
      .string()
      .refine(val => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid userId format",
      })
      .optional(),
    balance: z.number().min(0).optional(),
    currency: z.string().optional(),
    isBlocked: z.boolean().optional(),
  }),
});

export const getWalletsQuerySchema = z.object({
    search: z.string().optional(),
    role: z.enum(Object.values(Role) as [string]).optional(),
    isBlocked: z.enum(['true', 'false']).optional(),
    minBalance: z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), {
        message: "minBalance must be a valid number"
    }),
    maxBalance: z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), {
        message: "maxBalance must be a valid number"
    }),
    sortBy: z.enum(['balance', 'createdAt', 'name', 'email', 'role']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('10').transform(Number)
});