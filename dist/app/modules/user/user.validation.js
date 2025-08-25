"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsersQuerySchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const user_interface_1 = require("./user.interface");
exports.createUserSchema = zod_1.default.object({
    name: zod_1.default
        .string({ message: "Name must be string" })
        .min(2, { message: "Name must be at least 2 characters long." })
        .max(50, { message: "Name cannot exceed 50 characters." }),
    email: zod_1.default
        .string({ message: "Email must be string" })
        .email({ message: "Invalid email address format." })
        .min(5, { message: "Email must be at least 5 characters long." })
        .max(100, { message: "Email cannot exceed 100 characters." }),
    phone: zod_1.default
        .string({ message: "Phone Number must be string" })
        .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
        message: "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
    }),
    photo: zod_1.default.string().url().optional(),
    password: zod_1.default
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
    address: zod_1.default.string().min(10).max(200),
    role: zod_1.default
        .enum(Object.values(user_interface_1.Role)),
    nid: zod_1.default.number().min(1000000000).max(999999999999),
});
exports.updateUserSchema = zod_1.default.object({
    name: zod_1.default
        .string({ message: "Name must be string" })
        .min(2, { message: "Name must be at least 2 characters long." })
        .max(50, { message: "Name cannot exceed 50 characters." })
        .optional(),
    email: zod_1.default
        .string({ message: "Email must be string" })
        .email({ message: "Invalid email address format." })
        .min(5, { message: "Email must be at least 5 characters long." })
        .max(100, { message: "Email cannot exceed 100 characters." })
        .optional(),
    phone: zod_1.default
        .string({ message: "Phone Number must be string" })
        .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
        message: "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
    })
        .optional(),
    photo: zod_1.default.string().url().optional(),
    address: zod_1.default.string().min(10).max(200).optional(),
    nid: zod_1.default.number().min(1000000000).max(9999999999).optional(),
    role: zod_1.default
        .enum(Object.values(user_interface_1.Role))
        .optional(),
    isAgentApproved: zod_1.default.boolean().optional(),
    isActive: zod_1.default
        .enum(Object.values(user_interface_1.IsActive))
        .optional(),
});
exports.getUsersQuerySchema = zod_1.default.object({
    search: zod_1.default.string().optional(),
    role: zod_1.default.enum(Object.values(user_interface_1.Role)).optional(),
    isActive: zod_1.default.enum(Object.values(user_interface_1.IsActive)).optional(),
    isAgentApproved: zod_1.default.enum(['true', 'false']).optional(),
    sortBy: zod_1.default.enum(['name', 'email', 'createdAt', 'role']).default('createdAt'),
    sortOrder: zod_1.default.enum(['asc', 'desc']).default('desc'),
    page: zod_1.default.string().optional().default('1').transform(Number),
    limit: zod_1.default.string().optional().default('10').transform(Number)
});
