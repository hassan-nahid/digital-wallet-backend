import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { Wallet } from "../wallet/wallet.model";
import { User } from "../user/user.model";
import { Transaction } from "./transaction.model";
import httpStatus from "http-status-codes";
import { TransactionStatus, TransactionType } from "./transaction.interface";
import { IsActive, Role } from "../user/user.interface";
import AppError from "../../errorHelpers/AppError";

interface TransactionQueryParams {
    search?: string;
    transactionType?: string;
    status?: string;
    senderRole?: string;
    receiverRole?: string;
    minAmount?: string;
    maxAmount?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
}

const addMoney = async (data: {
    userId: string;
    amount: number;
    description?: string;
}) => {
    const { userId, amount, description } = data;

    if (amount <= 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater than zero");
    }

    if (amount > 50000) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot top up more than 50,000 at once");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await User.findById(userId).session(session);
        if (!user) {
            throw new AppError(httpStatus.NOT_FOUND, "User not found");
        }

        if (user.isActive === IsActive.BLOCKED) {
            throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
        }

        const wallet = await Wallet.findOne({ userId: userId }).session(session);
        if (!wallet) {
            throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");
        }

        if (wallet.isBlocked) {
            throw new AppError(httpStatus.FORBIDDEN, "Wallet is blocked");
        }

        // Update balance
        wallet.balance += amount;
        await wallet.save({ session });

        const transactionId = `tr_id_${uuidv4()}`;

        const transaction = await Transaction.create([{
            sender: null,
            receiver: userId,
            walletId: wallet._id,
            transactionId,
            transactionType: TransactionType.ADD_MONEY,
            amount,
            fee: 0,
            status: TransactionStatus.APPROVED,
            description: description || "Wallet top-up from external source",
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return {
            transaction: transaction[0],
            newBalance: wallet.balance
        };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const sendMoney = async (data: {
    senderId: string;
    receiverId: string;
    amount: number;
    description?: string;
}) => {
    const { senderId, receiverId, amount, description } = data;

    if (senderId === receiverId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Cannot send money to yourself");
    }

    if (amount <= 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater than zero");
    }

    if (amount > 50000) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot send more than 50,000 at once");
    }


    let fee = 0;
    if (amount >= 1000 && amount <= 20000) {
        fee = 10;
    } else if (amount > 20000) {
        fee = 10 * 1.5;
    }

    const totalAmountToDeduct = amount + fee;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const senderWallet = await Wallet.findOne({ userId: senderId }).session(session);
        const receiverWallet = await Wallet.findOne({ userId: receiverId }).session(session);

        const senderUser = await User.findById(senderId).session(session);
        const receiverUser = await User.findById(receiverId).session(session);

        if (!senderUser || !receiverUser) {
            throw new AppError(httpStatus.NOT_FOUND, "Sender or Receiver user not found");
        }

        if (senderUser.isActive === IsActive.BLOCKED || receiverUser.isActive === IsActive.BLOCKED) {
            throw new AppError(httpStatus.FORBIDDEN, "Sender or Receiver user is blocked");
        }

        if (!senderWallet || !receiverWallet) {
            throw new AppError(httpStatus.NOT_FOUND, "Sender or Receiver wallet not found");
        }

        if (senderWallet.isBlocked || receiverWallet.isBlocked) {
            throw new AppError(httpStatus.FORBIDDEN, "Sender or Receiver wallet is blocked");
        }

        if (senderWallet.balance < totalAmountToDeduct) {
            throw new AppError(httpStatus.BAD_REQUEST, "Insufficient balance");
        }

        senderWallet.balance -= totalAmountToDeduct;
        receiverWallet.balance += amount;

        await senderWallet.save({ session });
        await receiverWallet.save({ session });

        const transactionId1 = `tr_id_${uuidv4()}`;
        const transactionId2 = `tr_id_${uuidv4()}`;

        const senderTransaction = await Transaction.create([{
            sender: senderId,
            receiver: receiverId,
            walletId: senderWallet._id,
            transactionId: transactionId1,
            transactionType: TransactionType.SEND_MONEY,
            amount,
            fee,
            status: TransactionStatus.APPROVED,
            description: description || "Money sent",
        }], { session });

        const receiverTransaction = await Transaction.create([{
            sender: senderId,
            receiver: receiverId,
            walletId: receiverWallet._id,
            transactionId: transactionId2,
            transactionType: TransactionType.ADD_MONEY,
            amount,
            fee: 0,
            status: TransactionStatus.APPROVED,
            description: description || "Money received",
        }], { session });

        // Add fee to admin account if fee is charged
        let feeTransaction = null;
        if (fee > 0) {
            const adminUser = await User.findOne({ role: Role.ADMIN }).session(session);
            if (!adminUser) {
                throw new AppError(httpStatus.NOT_FOUND, "Admin user not found");
            }

            const adminWallet = await Wallet.findOne({ userId: adminUser._id }).session(session);
            if (!adminWallet) {
                throw new AppError(httpStatus.NOT_FOUND, "Admin wallet not found");
            }

            adminWallet.adminProfit += fee;
            adminWallet.balance += fee;
            await adminWallet.save({ session });

            const feeTransactionResult = await Transaction.create([{
                sender: senderId,
                receiver: adminUser._id,
                walletId: adminWallet._id,
                transactionId: `tr_id_${uuidv4()}`,
                transactionType: TransactionType.ADMIN_PROFIT,
                amount: fee,
                fee: 0,
                status: TransactionStatus.APPROVED,
                description: "Admin fee from send money transaction",
            }], { session });

            feeTransaction = feeTransactionResult[0];
        }

        await session.commitTransaction();
        session.endSession();

        return {
            senderTransaction: senderTransaction[0],
            receiverTransaction: receiverTransaction[0],
            feeTransaction: feeTransaction
        };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
const cashIn = async (data: {
    senderId: string;
    receiverId: string;
    amount: number;
    description?: string;
}) => {
    const { senderId, receiverId, amount, description } = data;

    if (senderId === receiverId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Cannot send money to yourself");
    }

    if (amount <= 100) {
        throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater than 100");
    }

    if (amount > 100000) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot send more than 100000 at once");
    }

    const totalAmountToDeduct = amount

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const senderWallet = await Wallet.findOne({ userId: senderId }).session(session);
        const receiverWallet = await Wallet.findOne({ userId: receiverId }).session(session);

        const senderUser = await User.findById(senderId).session(session);
        const receiverUser = await User.findById(receiverId).session(session);

        if (!senderUser || !receiverUser) {
            throw new AppError(httpStatus.NOT_FOUND, "Sender or Receiver user not found");
        }


        if (senderUser.isActive === IsActive.BLOCKED || receiverUser.isActive === IsActive.BLOCKED) {
            throw new AppError(httpStatus.FORBIDDEN, "Sender or Receiver user is blocked");
        }
        if (senderUser.role !== Role.AGENT && senderUser.role !== Role.ADMIN) {
            throw new AppError(httpStatus.FORBIDDEN, "Only agents or admins can cash in money");
        }
        if (senderUser.isAgentApproved === false) {
            throw new AppError(httpStatus.FORBIDDEN, "Agent approval is required to cash in money");
        }
        if (receiverUser.role === Role.AGENT && receiverUser.isAgentApproved === false) {
            throw new AppError(httpStatus.FORBIDDEN, "Agent approval is required to cash in money");
        }

        if (
            (senderUser.role === Role.AGENT && receiverUser.role !== Role.USER) ||
            (senderUser.role === Role.ADMIN && receiverUser.role !== Role.AGENT)
        ) {
            throw new AppError(httpStatus.FORBIDDEN, "Invalid cash-in permission between these roles");
        }


        if (!senderWallet || !receiverWallet) {
            throw new AppError(httpStatus.NOT_FOUND, "Sender or Receiver wallet not found");
        }

        if (senderWallet.isBlocked || receiverWallet.isBlocked) {
            throw new AppError(httpStatus.FORBIDDEN, "Sender or Receiver wallet is blocked");
        }

        if (senderWallet.balance < totalAmountToDeduct) {
            throw new AppError(httpStatus.BAD_REQUEST, "Insufficient balance");
        }

        senderWallet.balance -= totalAmountToDeduct;
        receiverWallet.balance += amount;

        await senderWallet.save({ session });
        await receiverWallet.save({ session });

        const transactionId1 = `tr_id_${uuidv4()}`;
        const transactionId2 = `tr_id_${uuidv4()}`;

        const senderTransaction = await Transaction.create([{
            sender: senderId,
            receiver: receiverId,
            walletId: senderWallet._id,
            transactionId: transactionId1,
            transactionType: TransactionType.CASH_IN,
            amount,
            fee: 0,
            status: TransactionStatus.APPROVED,
            description: description || "Cash in money",
        }], { session });

        const receiverTransaction = await Transaction.create([{
            sender: senderId,
            receiver: receiverId,
            walletId: receiverWallet._id,
            transactionId: transactionId2,
            transactionType: TransactionType.ADD_MONEY,
            amount,
            fee: 0,
            status: TransactionStatus.APPROVED,
            description: description || "Money received",
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return {
            senderTransaction: senderTransaction[0],
            receiverTransaction: receiverTransaction[0]
        };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
const cashOut = async (data: {
    senderId: string;
    receiverId: string;
    amount: number;
    description?: string;
}) => {
    const { senderId, receiverId, amount, description } = data;

    if (senderId === receiverId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Cannot send money to yourself");
    }

    if (amount <= 100) {
        throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater than 100");
    }

    if (amount > 50000) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot send more than 50000 at once");
    }


    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const senderWallet = await Wallet.findOne({ userId: senderId }).session(session);
        const receiverWallet = await Wallet.findOne({ userId: receiverId }).session(session);

        const senderUser = await User.findById(senderId).session(session);
        const receiverUser = await User.findById(receiverId).session(session);

        let fee = 0;
        let commission = 0;
        let adminProfit = 0;

        if (senderUser?.role === Role.USER && receiverUser?.role === Role.AGENT) {
            const unit = Math.floor(amount / 1000);
            fee = unit * 10;
            commission = unit * 4;
            adminProfit = unit * 6;
        } else if (senderUser?.role === Role.AGENT && receiverUser?.role === Role.ADMIN) {
            fee = 0;
            commission = 0;
            adminProfit = 0;
        }
        const totalAmountToDeduct = amount + fee;

        if (!senderUser || !receiverUser) {
            throw new AppError(httpStatus.NOT_FOUND, "Sender or Receiver user not found");
        }


        if (senderUser.isActive === IsActive.BLOCKED || receiverUser.isActive === IsActive.BLOCKED) {
            throw new AppError(httpStatus.FORBIDDEN, "Sender or Receiver user is blocked");
        }

        if (senderUser.role === Role.AGENT && senderUser.isAgentApproved === false) {
            throw new AppError(httpStatus.FORBIDDEN, "Agent approval is required to cash out money");
        }
        if (receiverUser.role === Role.AGENT && receiverUser.isAgentApproved === false) {
            throw new AppError(httpStatus.FORBIDDEN, "Agent approval is required to cash out money");
        }

        if (senderUser.role === Role.USER && receiverUser.role !== Role.AGENT) {
            throw new AppError(httpStatus.FORBIDDEN, "User can only cash out to an Agent");
        }
        if (senderUser.role === Role.AGENT && receiverUser.role !== Role.ADMIN) {
            throw new AppError(httpStatus.FORBIDDEN, "Agent can only cash out to an Admin");
        }


        if (!senderWallet || !receiverWallet) {
            throw new AppError(httpStatus.NOT_FOUND, "Sender or Receiver wallet not found");
        }

        if (senderWallet.isBlocked || receiverWallet.isBlocked) {
            throw new AppError(httpStatus.FORBIDDEN, "Sender or Receiver wallet is blocked");
        }

        if (senderWallet.balance < totalAmountToDeduct) {
            throw new AppError(httpStatus.BAD_REQUEST, "Insufficient balance");
        }

        senderWallet.balance -= totalAmountToDeduct;
        receiverWallet.balance += amount;

        await senderWallet.save({ session });
        await receiverWallet.save({ session });

        const transactionId1 = `tr_id_${uuidv4()}`;
        const transactionId2 = `tr_id_${uuidv4()}`;

        const senderTransaction = await Transaction.create([{
            sender: senderId,
            receiver: receiverId,
            walletId: senderWallet._id,
            transactionId: transactionId1,
            transactionType: TransactionType.CASH_OUT,
            amount,
            fee: fee,
            status: TransactionStatus.APPROVED,
            description: description || "Cash out money",
        }], { session });

        const receiverTransaction = await Transaction.create([{
            sender: senderId,
            receiver: receiverId,
            walletId: receiverWallet._id,
            transactionId: transactionId2,
            transactionType: TransactionType.ADD_MONEY,
            amount,
            fee: 0,
            status: TransactionStatus.APPROVED,
            description: description || "Money received",
        }], { session });

        // Initialize variables for admin and commission transactions
        let adminTransaction = null;
        let commissionTransaction = null;

        if (adminProfit > 0) {
            const adminUser = await User.findOne({ role: Role.ADMIN });
            if (!adminUser) {
                throw new AppError(httpStatus.NOT_FOUND, "Admin user not found");
            }

            const adminWallet = await Wallet.findOne({ userId: adminUser._id }).session(session);
            if (!adminWallet) {
                throw new AppError(httpStatus.NOT_FOUND, "Admin wallet not found");
            }

            adminWallet.adminProfit += adminProfit;
            adminWallet.balance += adminProfit;
            await adminWallet.save({ session });

            const adminTransactionResult = await Transaction.create([{
                sender: senderId,
                receiver: adminUser._id,
                walletId: adminWallet._id,
                transactionId: `tr_id_${uuidv4()}`,
                transactionType: TransactionType.ADMIN_PROFIT,
                amount: adminProfit,
                fee: 0,
                status: TransactionStatus.APPROVED,
                description: "Admin profit from cash out",
            }], { session });

            adminTransaction = adminTransactionResult[0];
        }


        if (commission > 0 && receiverUser.role === Role.AGENT) {
            const agentWallet = await Wallet.findOne({ userId: receiverUser._id }).session(session);

            if (!agentWallet) {
                throw new AppError(httpStatus.NOT_FOUND, "Agent wallet not found");
            }

            agentWallet.commission += commission;
            agentWallet.balance += commission;
            await agentWallet.save({ session });

            const commissionTransactionResult = await Transaction.create([{
                sender: senderId,
                receiver: receiverUser._id,
                walletId: agentWallet._id,
                transactionId: `tr_id_${uuidv4()}`,
                transactionType: TransactionType.COMMISSION,
                amount: commission,
                fee: 0,
                status: TransactionStatus.APPROVED,
                description: "Commission from cash out",
            }], { session });

            commissionTransaction = commissionTransactionResult[0];
        }


        await session.commitTransaction();
        session.endSession();

        return {
            senderTransaction: senderTransaction[0],
            receiverTransaction: receiverTransaction[0],
            adminTransaction: adminTransaction,
            commissionTransaction: commissionTransaction,
        };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};


const adminWithdraw = async (data: {
    userId: string;
    amount: number;
    description?: string;
}) => {
    const { userId, amount, description } = data;

    if (amount <= 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater than zero");
    }

    if (amount > 100000) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot top up more than 100,000 at once");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await User.findById(userId).session(session);
        if (!user) {
            throw new AppError(httpStatus.NOT_FOUND, "User not found");
        }

        if (user.isActive === IsActive.BLOCKED) {
            throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
        }
        if (user.role !== Role.ADMIN) {
            throw new AppError(httpStatus.FORBIDDEN, "Only admins can withdraw money");
        }

        const wallet = await Wallet.findOne({ userId: userId }).session(session);
        if (!wallet) {
            throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");
        }

        if (wallet.isBlocked) {
            throw new AppError(httpStatus.FORBIDDEN, "Wallet is blocked");
        }

        // Update balance
        wallet.balance -= amount;
        await wallet.save({ session });

        const transactionId = `tr_id_${uuidv4()}`;

        const transaction = await Transaction.create([{
            sender: userId,
            receiver: null, 
            walletId: wallet._id,
            transactionId,
            transactionType: TransactionType.ADMIN_WITHDRAW,
            amount,
            fee: 0,
            status: TransactionStatus.APPROVED,
            description: description || "Admin withdrawal to external account"
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return {
            transaction: transaction[0],
            newBalance: wallet.balance
        };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
interface MyTransactionsQuery {
    transactionType?: string;
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
}

const getMyTransactions = async (
    userId: string,
    query: MyTransactionsQuery = {}
) => {
    const {
        transactionType,
        page = 1,
        limit = 10,
        sortOrder = 'desc',
    } = query;

    const filter: any = {
        $or: [
            { sender: userId },
            { receiver: userId }
        ]
    };
    if (transactionType) {
        filter.transactionType = transactionType;
    }

    const skip = (page - 1) * limit;

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
        .populate("sender", "name email phone")
        .populate("receiver", "name email phone")
        .populate("walletId")
        .sort({ createdAt: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit);

    const formatted = transactions.map(transaction => {
        const transactionObj = transaction.toObject();
        return {
            ...transactionObj,
            sender: transactionObj.sender ? {
                _id: (transactionObj.sender as any)._id,
                name: (transactionObj.sender as any).name,
                email: (transactionObj.sender as any).email,
                phone: (transactionObj.sender as any).phone
            } : null,
            receiver: transactionObj.receiver ? {
                _id: (transactionObj.receiver as any)._id,
                name: (transactionObj.receiver as any).name,
                email: (transactionObj.receiver as any).email,
                phone: (transactionObj.receiver as any).phone
            } : null
        };
    });

    return {
        transactions: formatted,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalTransactions: total,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
        }
    };
};

const getAllTransactions = async (queryParams: TransactionQueryParams = {}) => {
    const {
        search,
        transactionType,
        status,
        senderRole,
        receiverRole,
        minAmount,
        maxAmount,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10
    } = queryParams;

    // Build filter object
    const filter: any = {};

    // Add transaction type filter
    if (transactionType) {
        filter.transactionType = transactionType;
    }

    // Add status filter
    if (status) {
        filter.status = status;
    }

    // Add amount range filter
    if (minAmount || maxAmount) {
        filter.amount = {};
        if (minAmount) filter.amount.$gte = parseFloat(minAmount);
        if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    // Add date range filter
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build aggregation pipeline
    const pipeline: any[] = [
        { $match: filter },
        {
            $lookup: {
                from: 'users',
                localField: 'sender',
                foreignField: '_id',
                as: 'senderUser'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'receiver',
                foreignField: '_id',
                as: 'receiverUser'
            }
        },
        {
            $lookup: {
                from: 'wallets',
                localField: 'walletId',
                foreignField: '_id',
                as: 'wallet'
            }
        }
    ];

    // Add user-based filters
    const userFilter: any = {};

    if (senderRole) {
        userFilter['senderUser.role'] = senderRole;
    }

    if (receiverRole) {
        userFilter['receiverUser.role'] = receiverRole;
    }

    if (search) {
        userFilter.$or = [
            { 'senderUser.name': { $regex: search, $options: 'i' } },
            { 'senderUser.email': { $regex: search, $options: 'i' } },
            { 'senderUser.phone': { $regex: search, $options: 'i' } },
            { 'receiverUser.name': { $regex: search, $options: 'i' } },
            { 'receiverUser.email': { $regex: search, $options: 'i' } },
            { 'receiverUser.phone': { $regex: search, $options: 'i' } },
            { transactionId: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    if (Object.keys(userFilter).length > 0) {
        pipeline.push({ $match: userFilter });
    }

    // Add sorting
    const sortObj: any = {};
    if (sortBy === 'senderName') {
        sortObj['senderUser.name'] = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'receiverName') {
        sortObj['receiverUser.name'] = sortOrder === 'asc' ? 1 : -1;
    } else {
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }
    pipeline.push({ $sort: sortObj });

    // Get total count for pagination
    const totalCountPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await Transaction.aggregate(totalCountPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: limit });

    const transactions = await Transaction.aggregate(pipeline);

    if (!transactions || transactions.length === 0) {
        return {
            transactions: [],
            pagination: {
                currentPage: page,
                totalPages: 0,
                totalTransactions: 0,
                hasNextPage: false,
                hasPrevPage: false
            }
        };
    }

    const formattedTransactions = transactions.map(transaction => {
        const senderUser = transaction.senderUser?.[0];
        const receiverUser = transaction.receiverUser?.[0];

        return {
            _id: transaction._id,
            transactionId: transaction.transactionId,
            transactionType: transaction.transactionType,
            amount: transaction.amount,
            fee: transaction.fee,
            status: transaction.status,
            description: transaction.description,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
            walletId: transaction.walletId,
            sender: senderUser ? {
                _id: senderUser._id,
                name: senderUser.name,
                email: senderUser.email,
                phone: senderUser.phone,
                role: senderUser.role
            } : null,
            receiver: receiverUser ? {
                _id: receiverUser._id,
                name: receiverUser.name,
                email: receiverUser.email,
                phone: receiverUser.phone,
                role: receiverUser.role
            } : null
        };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        transactions: formattedTransactions,
        pagination: {
            currentPage: page,
            totalPages,
            totalTransactions: total,
            hasNextPage,
            hasPrevPage
        }
    };
};

const getTransactionAnalytics = async () => {
    const totalTransactions = await Transaction.countDocuments();
    const result = await Transaction.aggregate([
        { $group: { _id: null, totalVolume: { $sum: "$amount" } } }
    ]);
    const totalVolume = result[0]?.totalVolume || 0;
    return {
        totalTransactions,
        totalVolume
    };
};

const getMyTransactionById = async (userId: string, transId: string) => {
   
    const transaction = await Transaction.findOne({
        _id: transId,
        $or: [
            { sender: userId },
            { receiver: userId }
        ]
    })
    .populate("sender", "name email phone")
    .populate("receiver", "name email phone")
    .populate("walletId");
    if (!transaction) {
        throw new AppError(httpStatus.NOT_FOUND, "Transaction not found or access denied");
    }
    return transaction;
};


export const TransactionServices = {
    sendMoney,
    cashIn,
    cashOut,
    addMoney,
    adminWithdraw,
    getMyTransactions,
    getAllTransactions,
    getTransactionAnalytics,
    getMyTransactionById
}