"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionServices = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const uuid_1 = require("uuid");
const wallet_model_1 = require("../wallet/wallet.model");
const user_model_1 = require("../user/user.model");
const transaction_model_1 = require("./transaction.model");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const transaction_interface_1 = require("./transaction.interface");
const user_interface_1 = require("../user/user.interface");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const addMoney = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, amount, description } = data;
    if (amount <= 0) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Amount must be greater than zero");
    }
    if (amount > 50000) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You cannot top up more than 50,000 at once");
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const user = yield user_model_1.User.findById(userId).session(session);
        if (!user) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
        }
        if (user.isActive === user_interface_1.IsActive.BLOCKED) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "User is blocked");
        }
        const wallet = yield wallet_model_1.Wallet.findOne({ userId: userId }).session(session);
        if (!wallet) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Wallet not found");
        }
        if (wallet.isBlocked) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Wallet is blocked");
        }
        // Update balance
        wallet.balance += amount;
        yield wallet.save({ session });
        const transactionId = `tr_id_${(0, uuid_1.v4)()}`;
        const transaction = yield transaction_model_1.Transaction.create([{
                sender: null,
                receiver: userId,
                walletId: wallet._id,
                transactionId,
                transactionType: transaction_interface_1.TransactionType.ADD_MONEY,
                amount,
                fee: 0,
                status: transaction_interface_1.TransactionStatus.APPROVED,
                description: description || "Wallet top-up from external source",
            }], { session });
        yield session.commitTransaction();
        session.endSession();
        return {
            transaction: transaction[0],
            newBalance: wallet.balance
        };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const sendMoney = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { senderId, receiverId, amount, description } = data;
    if (senderId === receiverId) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Cannot send money to yourself");
    }
    if (amount <= 0) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Amount must be greater than zero");
    }
    if (amount > 50000) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You cannot send more than 50,000 at once");
    }
    let fee = 0;
    if (amount >= 1000 && amount <= 20000) {
        fee = 10;
    }
    else if (amount > 20000) {
        fee = 10 * 1.5;
    }
    const totalAmountToDeduct = amount + fee;
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const senderWallet = yield wallet_model_1.Wallet.findOne({ userId: senderId }).session(session);
        const receiverWallet = yield wallet_model_1.Wallet.findOne({ userId: receiverId }).session(session);
        const senderUser = yield user_model_1.User.findById(senderId).session(session);
        const receiverUser = yield user_model_1.User.findById(receiverId).session(session);
        if (!senderUser || !receiverUser) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Sender or Receiver user not found");
        }
        if (senderUser.isActive === user_interface_1.IsActive.BLOCKED || receiverUser.isActive === user_interface_1.IsActive.BLOCKED) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Sender or Receiver user is blocked");
        }
        if (!senderWallet || !receiverWallet) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Sender or Receiver wallet not found");
        }
        if (senderWallet.isBlocked || receiverWallet.isBlocked) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Sender or Receiver wallet is blocked");
        }
        if (senderWallet.balance < totalAmountToDeduct) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Insufficient balance");
        }
        senderWallet.balance -= totalAmountToDeduct;
        receiverWallet.balance += amount;
        yield senderWallet.save({ session });
        yield receiverWallet.save({ session });
        const transactionId1 = `tr_id_${(0, uuid_1.v4)()}`;
        const transactionId2 = `tr_id_${(0, uuid_1.v4)()}`;
        const senderTransaction = yield transaction_model_1.Transaction.create([{
                sender: senderId,
                receiver: receiverId,
                walletId: senderWallet._id,
                transactionId: transactionId1,
                transactionType: transaction_interface_1.TransactionType.SEND_MONEY,
                amount,
                fee,
                status: transaction_interface_1.TransactionStatus.APPROVED,
                description: description || "Money sent",
            }], { session });
        const receiverTransaction = yield transaction_model_1.Transaction.create([{
                sender: senderId,
                receiver: receiverId,
                walletId: receiverWallet._id,
                transactionId: transactionId2,
                transactionType: transaction_interface_1.TransactionType.ADD_MONEY,
                amount,
                fee: 0,
                status: transaction_interface_1.TransactionStatus.APPROVED,
                description: description || "Money received",
            }], { session });
        // Add fee to admin account if fee is charged
        let feeTransaction = null;
        if (fee > 0) {
            const adminUser = yield user_model_1.User.findOne({ role: user_interface_1.Role.ADMIN }).session(session);
            if (!adminUser) {
                throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Admin user not found");
            }
            const adminWallet = yield wallet_model_1.Wallet.findOne({ userId: adminUser._id }).session(session);
            if (!adminWallet) {
                throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Admin wallet not found");
            }
            adminWallet.adminProfit += fee;
            adminWallet.balance += fee;
            yield adminWallet.save({ session });
            const feeTransactionResult = yield transaction_model_1.Transaction.create([{
                    sender: senderId,
                    receiver: adminUser._id,
                    walletId: adminWallet._id,
                    transactionId: `tr_id_${(0, uuid_1.v4)()}`,
                    transactionType: transaction_interface_1.TransactionType.ADMIN_PROFIT,
                    amount: fee,
                    fee: 0,
                    status: transaction_interface_1.TransactionStatus.APPROVED,
                    description: "Admin fee from send money transaction",
                }], { session });
            feeTransaction = feeTransactionResult[0];
        }
        yield session.commitTransaction();
        session.endSession();
        return {
            senderTransaction: senderTransaction[0],
            receiverTransaction: receiverTransaction[0],
            feeTransaction: feeTransaction
        };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const cashIn = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { senderId, receiverId, amount, description } = data;
    if (senderId === receiverId) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Cannot send money to yourself");
    }
    if (amount <= 100) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Amount must be greater than 100");
    }
    if (amount > 100000) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You cannot send more than 100000 at once");
    }
    const totalAmountToDeduct = amount;
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const senderWallet = yield wallet_model_1.Wallet.findOne({ userId: senderId }).session(session);
        const receiverWallet = yield wallet_model_1.Wallet.findOne({ userId: receiverId }).session(session);
        const senderUser = yield user_model_1.User.findById(senderId).session(session);
        const receiverUser = yield user_model_1.User.findById(receiverId).session(session);
        if (!senderUser || !receiverUser) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Sender or Receiver user not found");
        }
        if (senderUser.isActive === user_interface_1.IsActive.BLOCKED || receiverUser.isActive === user_interface_1.IsActive.BLOCKED) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Sender or Receiver user is blocked");
        }
        if (senderUser.role !== user_interface_1.Role.AGENT && senderUser.role !== user_interface_1.Role.ADMIN) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Only agents or admins can cash in money");
        }
        if (senderUser.isAgentApproved === false) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Agent approval is required to cash in money");
        }
        if (receiverUser.role === user_interface_1.Role.AGENT && receiverUser.isAgentApproved === false) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Agent approval is required to cash in money");
        }
        if ((senderUser.role === user_interface_1.Role.AGENT && receiverUser.role !== user_interface_1.Role.USER) ||
            (senderUser.role === user_interface_1.Role.ADMIN && receiverUser.role !== user_interface_1.Role.AGENT)) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Invalid cash-in permission between these roles");
        }
        if (!senderWallet || !receiverWallet) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Sender or Receiver wallet not found");
        }
        if (senderWallet.isBlocked || receiverWallet.isBlocked) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Sender or Receiver wallet is blocked");
        }
        if (senderWallet.balance < totalAmountToDeduct) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Insufficient balance");
        }
        senderWallet.balance -= totalAmountToDeduct;
        receiverWallet.balance += amount;
        yield senderWallet.save({ session });
        yield receiverWallet.save({ session });
        const transactionId1 = `tr_id_${(0, uuid_1.v4)()}`;
        const transactionId2 = `tr_id_${(0, uuid_1.v4)()}`;
        const senderTransaction = yield transaction_model_1.Transaction.create([{
                sender: senderId,
                receiver: receiverId,
                walletId: senderWallet._id,
                transactionId: transactionId1,
                transactionType: transaction_interface_1.TransactionType.CASH_IN,
                amount,
                fee: 0,
                status: transaction_interface_1.TransactionStatus.APPROVED,
                description: description || "Cash in money",
            }], { session });
        const receiverTransaction = yield transaction_model_1.Transaction.create([{
                sender: senderId,
                receiver: receiverId,
                walletId: receiverWallet._id,
                transactionId: transactionId2,
                transactionType: transaction_interface_1.TransactionType.ADD_MONEY,
                amount,
                fee: 0,
                status: transaction_interface_1.TransactionStatus.APPROVED,
                description: description || "Money received",
            }], { session });
        yield session.commitTransaction();
        session.endSession();
        return {
            senderTransaction: senderTransaction[0],
            receiverTransaction: receiverTransaction[0]
        };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const cashOut = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { senderId, receiverId, amount, description } = data;
    if (senderId === receiverId) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Cannot send money to yourself");
    }
    if (amount <= 100) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Amount must be greater than 100");
    }
    if (amount > 50000) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You cannot send more than 50000 at once");
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const senderWallet = yield wallet_model_1.Wallet.findOne({ userId: senderId }).session(session);
        const receiverWallet = yield wallet_model_1.Wallet.findOne({ userId: receiverId }).session(session);
        const senderUser = yield user_model_1.User.findById(senderId).session(session);
        const receiverUser = yield user_model_1.User.findById(receiverId).session(session);
        let fee = 0;
        let commission = 0;
        let adminProfit = 0;
        if ((senderUser === null || senderUser === void 0 ? void 0 : senderUser.role) === user_interface_1.Role.USER && (receiverUser === null || receiverUser === void 0 ? void 0 : receiverUser.role) === user_interface_1.Role.AGENT) {
            const unit = Math.floor(amount / 1000);
            fee = unit * 10;
            commission = unit * 4;
            adminProfit = unit * 6;
        }
        else if ((senderUser === null || senderUser === void 0 ? void 0 : senderUser.role) === user_interface_1.Role.AGENT && (receiverUser === null || receiverUser === void 0 ? void 0 : receiverUser.role) === user_interface_1.Role.ADMIN) {
            fee = 0;
            commission = 0;
            adminProfit = 0;
        }
        const totalAmountToDeduct = amount + fee;
        if (!senderUser || !receiverUser) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Sender or Receiver user not found");
        }
        if (senderUser.isActive === user_interface_1.IsActive.BLOCKED || receiverUser.isActive === user_interface_1.IsActive.BLOCKED) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Sender or Receiver user is blocked");
        }
        if (senderUser.role === user_interface_1.Role.AGENT && senderUser.isAgentApproved === false) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Agent approval is required to cash out money");
        }
        if (receiverUser.role === user_interface_1.Role.AGENT && receiverUser.isAgentApproved === false) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Agent approval is required to cash out money");
        }
        if (senderUser.role === user_interface_1.Role.USER && receiverUser.role !== user_interface_1.Role.AGENT) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "User can only cash out to an Agent");
        }
        if (senderUser.role === user_interface_1.Role.AGENT && receiverUser.role !== user_interface_1.Role.ADMIN) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Agent can only cash out to an Admin");
        }
        if (!senderWallet || !receiverWallet) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Sender or Receiver wallet not found");
        }
        if (senderWallet.isBlocked || receiverWallet.isBlocked) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Sender or Receiver wallet is blocked");
        }
        if (senderWallet.balance < totalAmountToDeduct) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Insufficient balance");
        }
        senderWallet.balance -= totalAmountToDeduct;
        receiverWallet.balance += amount;
        yield senderWallet.save({ session });
        yield receiverWallet.save({ session });
        const transactionId1 = `tr_id_${(0, uuid_1.v4)()}`;
        const transactionId2 = `tr_id_${(0, uuid_1.v4)()}`;
        const senderTransaction = yield transaction_model_1.Transaction.create([{
                sender: senderId,
                receiver: receiverId,
                walletId: senderWallet._id,
                transactionId: transactionId1,
                transactionType: transaction_interface_1.TransactionType.CASH_OUT,
                amount,
                fee: fee,
                status: transaction_interface_1.TransactionStatus.APPROVED,
                description: description || "Cash out money",
            }], { session });
        const receiverTransaction = yield transaction_model_1.Transaction.create([{
                sender: senderId,
                receiver: receiverId,
                walletId: receiverWallet._id,
                transactionId: transactionId2,
                transactionType: transaction_interface_1.TransactionType.ADD_MONEY,
                amount,
                fee: 0,
                status: transaction_interface_1.TransactionStatus.APPROVED,
                description: description || "Money received",
            }], { session });
        // Initialize variables for admin and commission transactions
        let adminTransaction = null;
        let commissionTransaction = null;
        if (adminProfit > 0) {
            const adminUser = yield user_model_1.User.findOne({ role: user_interface_1.Role.ADMIN });
            if (!adminUser) {
                throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Admin user not found");
            }
            const adminWallet = yield wallet_model_1.Wallet.findOne({ userId: adminUser._id }).session(session);
            if (!adminWallet) {
                throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Admin wallet not found");
            }
            adminWallet.adminProfit += adminProfit;
            adminWallet.balance += adminProfit;
            yield adminWallet.save({ session });
            const adminTransactionResult = yield transaction_model_1.Transaction.create([{
                    sender: senderId,
                    receiver: adminUser._id,
                    walletId: adminWallet._id,
                    transactionId: `tr_id_${(0, uuid_1.v4)()}`,
                    transactionType: transaction_interface_1.TransactionType.ADMIN_PROFIT,
                    amount: adminProfit,
                    fee: 0,
                    status: transaction_interface_1.TransactionStatus.APPROVED,
                    description: "Admin profit from cash out",
                }], { session });
            adminTransaction = adminTransactionResult[0];
        }
        if (commission > 0 && receiverUser.role === user_interface_1.Role.AGENT) {
            const agentWallet = yield wallet_model_1.Wallet.findOne({ userId: receiverUser._id }).session(session);
            if (!agentWallet) {
                throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Agent wallet not found");
            }
            agentWallet.commission += commission;
            agentWallet.balance += commission;
            yield agentWallet.save({ session });
            const commissionTransactionResult = yield transaction_model_1.Transaction.create([{
                    sender: senderId,
                    receiver: receiverUser._id,
                    walletId: agentWallet._id,
                    transactionId: `tr_id_${(0, uuid_1.v4)()}`,
                    transactionType: transaction_interface_1.TransactionType.COMMISSION,
                    amount: commission,
                    fee: 0,
                    status: transaction_interface_1.TransactionStatus.APPROVED,
                    description: "Commission from cash out",
                }], { session });
            commissionTransaction = commissionTransactionResult[0];
        }
        yield session.commitTransaction();
        session.endSession();
        return {
            senderTransaction: senderTransaction[0],
            receiverTransaction: receiverTransaction[0],
            adminTransaction: adminTransaction,
            commissionTransaction: commissionTransaction,
        };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const adminWithdraw = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, amount, description } = data;
    if (amount <= 0) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Amount must be greater than zero");
    }
    if (amount > 100000) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "You cannot top up more than 100,000 at once");
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const user = yield user_model_1.User.findById(userId).session(session);
        if (!user) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
        }
        if (user.isActive === user_interface_1.IsActive.BLOCKED) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "User is blocked");
        }
        if (user.role !== user_interface_1.Role.ADMIN) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Only admins can withdraw money");
        }
        const wallet = yield wallet_model_1.Wallet.findOne({ userId: userId }).session(session);
        if (!wallet) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Wallet not found");
        }
        if (wallet.isBlocked) {
            throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Wallet is blocked");
        }
        // Update balance
        wallet.balance -= amount;
        yield wallet.save({ session });
        const transactionId = `tr_id_${(0, uuid_1.v4)()}`;
        const transaction = yield transaction_model_1.Transaction.create([{
                sender: userId,
                receiver: null,
                walletId: wallet._id,
                transactionId,
                transactionType: transaction_interface_1.TransactionType.ADMIN_WITHDRAW,
                amount,
                fee: 0,
                status: transaction_interface_1.TransactionStatus.APPROVED,
                description: description || "Admin withdrawal to external account"
            }], { session });
        yield session.commitTransaction();
        session.endSession();
        return {
            transaction: transaction[0],
            newBalance: wallet.balance
        };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const getMyTransactions = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const transactions = yield transaction_model_1.Transaction.find({
        $or: [
            { sender: userId },
            { receiver: userId }
        ]
    })
        .populate("sender", "name email phone")
        .populate("receiver", "name email phone")
        .populate("walletId")
        .sort({ createdAt: -1 }); // Sort by newest first
    if (!transactions || transactions.length === 0) {
        return []; // Return empty array instead of throwing error
    }
    return transactions.map(transaction => {
        const transactionObj = transaction.toObject();
        return Object.assign(Object.assign({}, transactionObj), { sender: transactionObj.sender ? {
                _id: transactionObj.sender._id,
                name: transactionObj.sender.name,
                email: transactionObj.sender.email,
                phone: transactionObj.sender.phone
            } : null, receiver: transactionObj.receiver ? {
                _id: transactionObj.receiver._id,
                name: transactionObj.receiver.name,
                email: transactionObj.receiver.email,
                phone: transactionObj.receiver.phone
            } : null });
    });
});
const getAllTransactions = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (queryParams = {}) {
    const { search, transactionType, status, senderRole, receiverRole, minAmount, maxAmount, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = queryParams;
    // Build filter object
    const filter = {};
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
        if (minAmount)
            filter.amount.$gte = parseFloat(minAmount);
        if (maxAmount)
            filter.amount.$lte = parseFloat(maxAmount);
    }
    // Add date range filter
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate)
            filter.createdAt.$gte = new Date(startDate);
        if (endDate)
            filter.createdAt.$lte = new Date(endDate);
    }
    // Calculate pagination
    const skip = (page - 1) * limit;
    // Build aggregation pipeline
    const pipeline = [
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
    const userFilter = {};
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
    const sortObj = {};
    if (sortBy === 'senderName') {
        sortObj['senderUser.name'] = sortOrder === 'asc' ? 1 : -1;
    }
    else if (sortBy === 'receiverName') {
        sortObj['receiverUser.name'] = sortOrder === 'asc' ? 1 : -1;
    }
    else {
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }
    pipeline.push({ $sort: sortObj });
    // Get total count for pagination
    const totalCountPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = yield transaction_model_1.Transaction.aggregate(totalCountPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;
    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: limit });
    const transactions = yield transaction_model_1.Transaction.aggregate(pipeline);
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
        var _a, _b;
        const senderUser = (_a = transaction.senderUser) === null || _a === void 0 ? void 0 : _a[0];
        const receiverUser = (_b = transaction.receiverUser) === null || _b === void 0 ? void 0 : _b[0];
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
});
exports.TransactionServices = {
    sendMoney,
    cashIn,
    cashOut,
    addMoney,
    adminWithdraw,
    getMyTransactions,
    getAllTransactions
};
