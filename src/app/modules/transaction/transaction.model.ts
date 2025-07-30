import { Schema, model } from "mongoose";
import { ITransaction, TransactionType, TransactionStatus } from "./transaction.interface";

const transactionSchema = new Schema<ITransaction>({
  sender: { type: Schema.Types.ObjectId, ref: "User", required: false },
  receiver: { type: Schema.Types.ObjectId, ref: "User", required: false },
  walletId: { type: Schema.Types.ObjectId, ref: "Wallet", required: true },
  transactionId: { type: String, required: true, unique: true },
  transactionType: {
    type: String,
    enum: Object.values(TransactionType),
    required: true,
  },
  amount: { type: Number, required: true },
  fee: { type: Number, default: 0 },
  status: {
    type: String,
    enum: Object.values(TransactionStatus),
    default: TransactionStatus.PENDING,
  },
  description: { type: String },
}, {
  timestamps: true,
  versionKey: false
});

export const Transaction = model<ITransaction>("Transaction", transactionSchema);
