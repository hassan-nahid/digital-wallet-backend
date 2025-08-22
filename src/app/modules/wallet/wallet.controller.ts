import { catchAsync } from "../../utils/catchAsync"
import { Request, Response, NextFunction } from "express"
import httpStatus from "http-status-codes"
import { sendResponse } from "../../utils/sendResponse"
import { WalletServices } from "./wallet.service"
import { JwtPayload } from "jsonwebtoken"

const getAllWallets = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const queryParams = (req as any).validatedQuery;
    const result = await WalletServices.getAllWallets(queryParams)
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Wallets fetched successfully",
        data: result.wallets,
        meta: {
            page: result.pagination.currentPage,
            limit: queryParams?.limit || 10,
            totalPage: result.pagination.totalPages,
            total: result.pagination.totalWallets
        }
    });
})
const getMyWallet = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload // JWT payload
    const userId = decodedToken.userId // Get userId from JWT payload
    const wallet = await WalletServices.getMyWallet(userId)
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Wallet fetched successfully",
        data: wallet,
    });
})
const blockWallet = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
   const userId = req.params.id
    const wallet = await WalletServices.blockWallet(userId)
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Wallet Blocked successfully",
        data: wallet,
    });
})
const unblockWallet = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
   const userId = req.params.id
    const wallet = await WalletServices.unblockWallet(userId)
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Wallet Unblocked successfully",
        data: wallet,
    });
})

const getWalletAnalytics = catchAsync(async (req: Request, res: Response) => {
    const analytics = await WalletServices.getWalletAnalytics();
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Wallet analytics fetched successfully",
        data: analytics
    });
});



export const WalletControllers = {
    getMyWallet,
    blockWallet,
    unblockWallet,
    getAllWallets,
    getWalletAnalytics
}