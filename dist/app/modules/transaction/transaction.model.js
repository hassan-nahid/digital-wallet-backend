"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const mongoose_1 = require("mongoose");
const transaction_interface_1 = require("./transaction.interface");
const transactionSchema = new mongoose_1.Schema({
    sender: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: false },
    receiver: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: false },
    walletId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Wallet", required: true },
    transactionId: { type: String, required: true, unique: true },
    transactionType: {
        type: String,
        enum: Object.values(transaction_interface_1.TransactionType),
        required: true,
    },
    amount: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    status: {
        type: String,
        enum: Object.values(transaction_interface_1.TransactionStatus),
        default: transaction_interface_1.TransactionStatus.PENDING,
    },
    description: { type: String },
}, {
    timestamps: true,
    versionKey: false
});
exports.Transaction = (0, mongoose_1.model)("Transaction", transactionSchema);
