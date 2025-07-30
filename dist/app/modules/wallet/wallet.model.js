"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
const mongoose_1 = require("mongoose");
const walletSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    balance: {
        type: Number,
        default: 50,
    },
    currency: {
        type: String,
        default: "BDT",
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    commission: {
        type: Number,
        default: 0,
    },
    adminProfit: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.Wallet = (0, mongoose_1.model)("Wallet", walletSchema);
