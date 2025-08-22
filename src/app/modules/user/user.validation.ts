import z from "zod";
import { IsActive, Role } from "./user.interface";

export const createUserSchema = z.object({
    name: z
        .string({ message: "Name must be string" })
        .min(2, { message: "Name must be at least 2 characters long." })
        .max(50, { message: "Name cannot exceed 50 characters." }),
    email: z
        .string({ message: "Email must be string" })
        .email({ message: "Invalid email address format." })
        .min(5, { message: "Email must be at least 5 characters long." })
        .max(100, { message: "Email cannot exceed 100 characters." }),
    phone: z
        .string({ message: "Phone Number must be string" })
        .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
            message: "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
        }),
    photo: z.string().url().optional(),
    password: z
        .string({ message: "Password must be string" })
        .min(8, { message: "Password must be at least 8 characters long." })
        .regex(/^(?=.*[A-Z])/, {
            message: "Password must contain at least 1 uppercase letter.",
        })
        .regex(/^(?=.*[!@#$%^&*])/, {
            message: "Password must contain at least 1 special character.",
        })
        .regex(/^(?=.*\d)/, {
            message: "Password must contain at least 1 number.",
        }),
    address: z.string().min(10).max(200),
    role: z
        .enum(Object.values(Role) as [string]),
    nid: z.number().min(1000000000).max(999999999999),
});

export const updateUserSchema = z.object({
    name: z
        .string({ message: "Name must be string" })
        .min(2, { message: "Name must be at least 2 characters long." })
        .max(50, { message: "Name cannot exceed 50 characters." })
        .optional(),
    email: z
        .string({ message: "Email must be string" })
        .email({ message: "Invalid email address format." })
        .min(5, { message: "Email must be at least 5 characters long." })
        .max(100, { message: "Email cannot exceed 100 characters." })
        .optional(),
    phone: z
        .string({ message: "Phone Number must be string" })
        .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
            message: "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
        })
        .optional(),
    photo: z.string().url().optional(),
    address: z.string().min(10).max(200).optional(),
    nid: z.number().min(1000000000).max(9999999999).optional(),
    role: z
        .enum(Object.values(Role) as [string])
        .optional(),
    isAgentApproved: z.boolean().optional(),
    isActive: z
        .enum(Object.values(IsActive) as [string])
        .optional(),

});

export const getUsersQuerySchema = z.object({
    search: z.string().optional(),
    role: z.enum(Object.values(Role) as [string]).optional(),
    isActive: z.enum(Object.values(IsActive) as [string]).optional(),
    isAgentApproved: z.enum(['true', 'false']).optional(),
    sortBy: z.enum(['name', 'email', 'createdAt', 'role']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('10').transform(Number)
});