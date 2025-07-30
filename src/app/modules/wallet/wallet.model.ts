import { model, Schema } from "mongoose";

const walletSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
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
},
    {
        timestamps: true,
        versionKey: false,
    })

export const Wallet = model("Wallet", walletSchema);