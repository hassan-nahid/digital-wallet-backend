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
exports.WalletControllers = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const sendResponse_1 = require("../../utils/sendResponse");
const wallet_service_1 = require("./wallet.service");
const getAllWallets = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const queryParams = req.validatedQuery;
    const result = yield wallet_service_1.WalletServices.getAllWallets(queryParams);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Wallets fetched successfully",
        data: result.wallets,
        meta: {
            page: result.pagination.currentPage,
            limit: (queryParams === null || queryParams === void 0 ? void 0 : queryParams.limit) || 10,
            totalPage: result.pagination.totalPages,
            total: result.pagination.totalWallets
        }
    });
}));
const getMyWallet = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const decodedToken = req.user; // JWT payload
    const userId = decodedToken.userId; // Get userId from JWT payload
    const wallet = yield wallet_service_1.WalletServices.getMyWallet(userId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Wallet fetched successfully",
        data: wallet,
    });
}));
const blockWallet = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    const wallet = yield wallet_service_1.WalletServices.blockWallet(userId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Wallet Blocked successfully",
        data: wallet,
    });
}));
const unblockWallet = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    const wallet = yield wallet_service_1.WalletServices.unblockWallet(userId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Wallet Unblocked successfully",
        data: wallet,
    });
}));
const getWalletAnalytics = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const analytics = yield wallet_service_1.WalletServices.getWalletAnalytics();
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Wallet analytics fetched successfully",
        data: analytics
    });
}));
exports.WalletControllers = {
    getMyWallet,
    blockWallet,
    unblockWallet,
    getAllWallets,
    getWalletAnalytics
};
