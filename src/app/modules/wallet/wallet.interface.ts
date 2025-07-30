import { Types } from "mongoose";

export interface IWallet {
    userId: Types.ObjectId;
    balance: number;
    currency: string;
    isBlocked: boolean;
    adminProfit: number;
    commission: number;
}