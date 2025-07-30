import { z } from "zod";
import { TransactionStatus, TransactionType } from "./transaction.interface";
import { Role } from "../user/user.interface";
import mongoose from "mongoose";

export const createTransactionZodSchema = z.object({
  sender: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid ObjectId",
    }).optional(),
  receiver: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid ObjectId",
    }),
  amount: z.number().positive("Amount must be positive"),
  fee: z.number().nonnegative().optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
  description: z.string().optional(),
});

export const updateTransactionStatusZodSchema = z.object({
  status: z.nativeEnum(TransactionStatus),
});

export const addMoneyZodSchema = z.object({
  sender: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid ObjectId",
    }).optional(),
  amount: z.number().positive("Amount must be positive"),

  description: z.string().optional(),
});

export const getTransactionsQuerySchema = z.object({
    search: z.string().optional(),
    transactionType: z.enum(Object.values(TransactionType) as [string]).optional(),
    status: z.enum(Object.values(TransactionStatus) as [string]).optional(),
    senderRole: z.enum(Object.values(Role) as [string]).optional(),
    receiverRole: z.enum(Object.values(Role) as [string]).optional(),
    minAmount: z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), {
        message: "minAmount must be a valid number"
    }),
    maxAmount: z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), {
        message: "maxAmount must be a valid number"
    }),
    startDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
        message: "startDate must be a valid date"
    }),
    endDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
        message: "endDate must be a valid date"
    }),
    sortBy: z.enum(['amount', 'createdAt', 'transactionType', 'status', 'senderName', 'receiverName']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('10').transform(Number)
});