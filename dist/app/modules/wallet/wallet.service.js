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
exports.WalletServices = void 0;
const user_interface_1 = require("../user/user.interface");
const wallet_model_1 = require("./wallet.model");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const getAllWallets = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (queryParams = {}) {
    const { search, role, isBlocked, minBalance, maxBalance, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = queryParams;
    // Build filter object
    const filter = {};
    // Add balance range filter
    if (minBalance || maxBalance) {
        filter.balance = {};
        if (minBalance)
            filter.balance.$gte = parseFloat(minBalance);
        if (maxBalance)
            filter.balance.$lte = parseFloat(maxBalance);
    }
    // Add isBlocked filter
    if (isBlocked !== undefined) {
        filter.isBlocked = isBlocked === 'true';
    }
    // Calculate pagination
    const skip = (page - 1) * limit;
    // Build aggregation pipeline
    const pipeline = [
        { $match: filter },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            }
        },
        { $unwind: '$user' },
    ];
    // Add user-based filters
    const userFilter = {};
    if (role) {
        userFilter['user.role'] = role;
    }
    if (search) {
        userFilter.$or = [
            { 'user.name': { $regex: search, $options: 'i' } },
            { 'user.email': { $regex: search, $options: 'i' } },
            { 'user.phone': { $regex: search, $options: 'i' } }
        ];
    }
    if (Object.keys(userFilter).length > 0) {
        pipeline.push({ $match: userFilter });
    }
    // Add sorting
    const sortObj = {};
    if (sortBy === 'name' || sortBy === 'email' || sortBy === 'role') {
        sortObj[`user.${sortBy}`] = sortOrder === 'asc' ? 1 : -1;
    }
    else {
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }
    pipeline.push({ $sort: sortObj });
    // Get total count for pagination
    const totalCountPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = yield wallet_model_1.Wallet.aggregate(totalCountPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;
    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: limit });
    const wallets = yield wallet_model_1.Wallet.aggregate(pipeline);
    if (!wallets || wallets.length === 0) {
        return {
            wallets: [],
            pagination: {
                currentPage: page,
                totalPages: 0,
                totalWallets: 0,
                hasNextPage: false,
                hasPrevPage: false
            }
        };
    }
    const walletResponses = wallets.map(wallet => {
        const user = wallet.user;
        const walletResponse = {
            _id: wallet._id,
            balance: wallet.balance,
            isBlocked: wallet.isBlocked,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                nid: user.nid,
            },
        };
        if (user.role === user_interface_1.Role.AGENT) {
            walletResponse.commission = wallet.commission;
        }
        if (user.role === user_interface_1.Role.ADMIN) {
            walletResponse.adminProfit = wallet.adminProfit;
        }
        return walletResponse;
    });
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    return {
        wallets: walletResponses,
        pagination: {
            currentPage: page,
            totalPages,
            totalWallets: total,
            hasNextPage,
            hasPrevPage
        }
    };
});
const getMyWallet = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield wallet_model_1.Wallet.findOne({ userId: userId }).populate("userId");
    if (!wallet || !wallet.userId) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User or Wallet not found");
    }
    const user = wallet.userId;
    const walletResponse = {
        _id: wallet._id,
        balance: wallet.balance,
        isBlocked: wallet.isBlocked,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            nid: user.nid,
        },
    };
    if (user.role === user_interface_1.Role.AGENT) {
        walletResponse.commission = wallet.commission;
    }
    if (user.role === user_interface_1.Role.ADMIN) {
        walletResponse.adminProfit = wallet.adminProfit;
    }
    return walletResponse;
});
const blockWallet = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield wallet_model_1.Wallet.findOneAndUpdate({ userId: userId }, { isBlocked: true }, { new: true });
    if (!wallet) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Wallet not found");
    }
    return wallet;
});
const unblockWallet = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield wallet_model_1.Wallet.findOneAndUpdate({ userId: userId }, { isBlocked: false }, { new: true });
    if (!wallet) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Wallet not found");
    }
    return wallet;
});
const getWalletAnalytics = () => __awaiter(void 0, void 0, void 0, function* () {
    const totalWallets = yield wallet_model_1.Wallet.countDocuments();
    const totalBlocked = yield wallet_model_1.Wallet.countDocuments({ isBlocked: true });
    const totalUnblocked = yield wallet_model_1.Wallet.countDocuments({ isBlocked: false });
    return {
        totalWallets,
        totalBlocked,
        totalUnblocked
    };
});
exports.WalletServices = {
    getMyWallet,
    blockWallet,
    unblockWallet,
    getAllWallets,
    getWalletAnalytics
};
