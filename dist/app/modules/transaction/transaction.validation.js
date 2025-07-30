"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactionsQuerySchema = exports.addMoneyZodSchema = exports.updateTransactionStatusZodSchema = exports.createTransactionZodSchema = void 0;
const zod_1 = require("zod");
const transaction_interface_1 = require("./transaction.interface");
const user_interface_1 = require("../user/user.interface");
const mongoose_1 = __importDefault(require("mongoose"));
exports.createTransactionZodSchema = zod_1.z.object({
    sender: zod_1.z
        .string()
        .refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: "Invalid ObjectId",
    }).optional(),
    receiver: zod_1.z
        .string()
        .refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: "Invalid ObjectId",
    }),
    amount: zod_1.z.number().positive("Amount must be positive"),
    fee: zod_1.z.number().nonnegative().optional(),
    status: zod_1.z.nativeEnum(transaction_interface_1.TransactionStatus).optional(),
    description: zod_1.z.string().optional(),
});
exports.updateTransactionStatusZodSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(transaction_interface_1.TransactionStatus),
});
exports.addMoneyZodSchema = zod_1.z.object({
    sender: zod_1.z
        .string()
        .refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: "Invalid ObjectId",
    }).optional(),
    amount: zod_1.z.number().positive("Amount must be positive"),
    description: zod_1.z.string().optional(),
});
exports.getTransactionsQuerySchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    transactionType: zod_1.z.enum(Object.values(transaction_interface_1.TransactionType)).optional(),
    status: zod_1.z.enum(Object.values(transaction_interface_1.TransactionStatus)).optional(),
    senderRole: zod_1.z.enum(Object.values(user_interface_1.Role)).optional(),
    receiverRole: zod_1.z.enum(Object.values(user_interface_1.Role)).optional(),
    minAmount: zod_1.z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), {
        message: "minAmount must be a valid number"
    }),
    maxAmount: zod_1.z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), {
        message: "maxAmount must be a valid number"
    }),
    startDate: zod_1.z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
        message: "startDate must be a valid date"
    }),
    endDate: zod_1.z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
        message: "endDate must be a valid date"
    }),
    sortBy: zod_1.z.enum(['amount', 'createdAt', 'transactionType', 'status', 'senderName', 'receiverName']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
    page: zod_1.z.string().optional().default('1').transform(Number),
    limit: zod_1.z.string().optional().default('10').transform(Number)
});
