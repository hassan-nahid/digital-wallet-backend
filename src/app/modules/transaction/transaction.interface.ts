import { Types } from "mongoose";

export enum TransactionType {
    ADD_MONEY = 'add_money',
    SEND_MONEY = 'send_money',
    CASH_IN = 'cash_in',
    CASH_OUT = 'cash_out',
    ADMIN_PROFIT = 'admin_profit',
    COMMISSION = 'commission',
    ADMIN_WITHDRAW = 'admin_withdraw',
}

export enum TransactionStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
}

export interface ITransaction {
    sender?: Types.ObjectId; // Made optional for addMoney transactions
    receiver?: Types.ObjectId;
    walletId: Types.ObjectId; // Reference to the wallet
    transactionId: string;
    transactionType: TransactionType;
    amount: number;
    fee?: number;
    status: TransactionStatus;
    description?: string;
}