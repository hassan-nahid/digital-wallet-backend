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
exports.TransactionControllers = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const transaction_service_1 = require("./transaction.service");
const addMoney = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const sendMoneyData = yield transaction_service_1.TransactionServices.addMoney({
        userId: user.userId,
        amount: req.body.amount,
        description: req.body.description,
    });
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "Money Added Successfully",
        data: sendMoneyData
    });
}));
const sendMoney = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const sendMoneyData = yield transaction_service_1.TransactionServices.sendMoney({
        senderId: user.userId,
        receiverId: req.body.receiver,
        amount: req.body.amount,
        description: req.body.description,
    });
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "Send Money Successfully",
        data: sendMoneyData
    });
}));
const cashIn = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const sendMoneyData = yield transaction_service_1.TransactionServices.cashIn({
        senderId: user.userId,
        receiverId: req.body.receiver,
        amount: req.body.amount,
        description: req.body.description,
    });
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "Cash In Successfully",
        data: sendMoneyData
    });
}));
const cashOut = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const sendMoneyData = yield transaction_service_1.TransactionServices.cashOut({
        senderId: user.userId,
        receiverId: req.body.receiver,
        amount: req.body.amount,
        description: req.body.description,
    });
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "Cash Out Successfully",
        data: sendMoneyData
    });
}));
const adminWithdraw = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const sendMoneyData = yield transaction_service_1.TransactionServices.adminWithdraw({
        userId: user.userId,
        amount: req.body.amount,
        description: req.body.description,
    });
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "Admin Withdrawal Successfully",
        data: sendMoneyData
    });
}));
const getMyTransactionById = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { transId } = req.params;
    const result = yield transaction_service_1.TransactionServices.getMyTransactionById(user.userId, transId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Transactions Retrieved Successfully",
        data: result,
    });
}));
const getSingleTransactionById = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { transId } = req.params;
    const result = yield transaction_service_1.TransactionServices.getSingleTransactionById(transId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Transactions Retrieved Successfully",
        data: result,
    });
}));
const getMyTransactions = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const queryParams = req.query;
    const result = yield transaction_service_1.TransactionServices.getMyTransactions(user.userId, queryParams);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Transactions Retrieved Successfully",
        data: result.transactions,
        meta: {
            page: result.pagination.currentPage,
            limit: (queryParams === null || queryParams === void 0 ? void 0 : queryParams.limit) || 10,
            totalPage: result.pagination.totalPages,
            total: result.pagination.totalTransactions
        }
    });
}));
const getAllTransactions = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const queryParams = req.validatedQuery;
    const result = yield transaction_service_1.TransactionServices.getAllTransactions(queryParams);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "All Transactions Retrieved Successfully",
        data: result.transactions,
        meta: {
            page: result.pagination.currentPage,
            limit: (queryParams === null || queryParams === void 0 ? void 0 : queryParams.limit) || 10,
            totalPage: result.pagination.totalPages,
            total: result.pagination.totalTransactions
        }
    });
}));
const getTransactionAnalytics = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const analytics = yield transaction_service_1.TransactionServices.getTransactionAnalytics();
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Transaction analytics fetched successfully",
        data: analytics
    });
}));
exports.TransactionControllers = {
    sendMoney,
    cashIn,
    cashOut,
    addMoney,
    adminWithdraw,
    getMyTransactions,
    getAllTransactions,
    getTransactionAnalytics,
    getMyTransactionById,
    getSingleTransactionById
};
