"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWalletsQuerySchema = exports.updateWalletZodSchema = exports.createWalletZodSchema = void 0;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const user_interface_1 = require("../user/user.interface");
exports.createWalletZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z
            .string()
            .refine(val => mongoose_1.default.Types.ObjectId.isValid(val), {
            message: "Invalid userId format",
        }),
        balance: zod_1.z.number().min(0).optional(),
        currency: zod_1.z.string().default("USD").optional(),
        isBlocked: zod_1.z.boolean().optional(),
    }),
});
exports.updateWalletZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z
            .string()
            .refine(val => mongoose_1.default.Types.ObjectId.isValid(val), {
            message: "Invalid userId format",
        })
            .optional(),
        balance: zod_1.z.number().min(0).optional(),
        currency: zod_1.z.string().optional(),
        isBlocked: zod_1.z.boolean().optional(),
    }),
});
exports.getWalletsQuerySchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    role: zod_1.z.enum(Object.values(user_interface_1.Role)).optional(),
    isBlocked: zod_1.z.enum(['true', 'false']).optional(),
    minBalance: zod_1.z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), {
        message: "minBalance must be a valid number"
    }),
    maxBalance: zod_1.z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), {
        message: "maxBalance must be a valid number"
    }),
    sortBy: zod_1.z.enum(['balance', 'createdAt', 'name', 'email', 'role']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
    page: zod_1.z.string().optional().default('1').transform(Number),
    limit: zod_1.z.string().optional().default('10').transform(Number)
});
