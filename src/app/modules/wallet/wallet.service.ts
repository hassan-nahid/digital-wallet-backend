import { Role, IUser } from "../user/user.interface";
import { Wallet } from "./wallet.model";
import AppError from "../../errorHelpers/AppError";
import httpStatus from "http-status-codes";

interface WalletQueryParams {
    search?: string;
    role?: string;
    isBlocked?: string;
    minBalance?: string;
    maxBalance?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
}

const getAllWallets = async (queryParams: WalletQueryParams = {}) => {
    const {
        search,
        role,
        isBlocked,
        minBalance,
        maxBalance,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10
    } = queryParams;

    // Build filter object
    const filter: any = {};

    // Add balance range filter
    if (minBalance || maxBalance) {
        filter.balance = {};
        if (minBalance) filter.balance.$gte = parseFloat(minBalance);
        if (maxBalance) filter.balance.$lte = parseFloat(maxBalance);
    }

    // Add isBlocked filter
    if (isBlocked !== undefined) {
        filter.isBlocked = isBlocked === 'true';
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build aggregation pipeline
    const pipeline: any[] = [
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
    const userFilter: any = {};
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
    const sortObj: any = {};
    if (sortBy === 'name' || sortBy === 'email' || sortBy === 'role') {
        sortObj[`user.${sortBy}`] = sortOrder === 'asc' ? 1 : -1;
    } else {
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }
    pipeline.push({ $sort: sortObj });

    // Get total count for pagination
    const totalCountPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await Wallet.aggregate(totalCountPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: limit });

    const wallets = await Wallet.aggregate(pipeline);

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
        const user = wallet.user as IUser;

        const walletResponse: any = {
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

        if (user.role === Role.AGENT) {
            walletResponse.commission = wallet.commission;
        }
        if (user.role === Role.ADMIN) {
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
};
const getMyWallet = async (userId: string) => {
    const wallet = await Wallet.findOne({ userId: userId }).populate("userId");

    if (!wallet || !wallet.userId) {
        throw new AppError(httpStatus.NOT_FOUND, "User or Wallet not found");
    }

    const user = wallet.userId as unknown as IUser;

    const walletResponse: any = {
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

    if (user.role === Role.AGENT) {
        walletResponse.commission = wallet.commission;
    }
    if (user.role === Role.ADMIN) {
        walletResponse.adminProfit = wallet.adminProfit;
    }

    return walletResponse;

};
const blockWallet = async (userId: string) => {
  const wallet = await Wallet.findOneAndUpdate(
    { userId: userId },
    { isBlocked: true },
    { new: true }
  );

  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");
  }

  return wallet;
};
const unblockWallet = async (userId: string) => {
  const wallet = await Wallet.findOneAndUpdate(
    { userId: userId },
    { isBlocked: false },
    { new: true }
  );

  if (!wallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");
  }

  return wallet;
};



export const WalletServices = {
    getMyWallet,
    blockWallet,
    unblockWallet,
    getAllWallets
}