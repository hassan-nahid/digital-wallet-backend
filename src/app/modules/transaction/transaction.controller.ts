import { catchAsync } from "../../utils/catchAsync"
import { Request, Response, NextFunction } from "express"
import { sendResponse } from "../../utils/sendResponse"
import httpStatus from "http-status-codes"
import { JwtPayload } from "jsonwebtoken"
import { TransactionServices } from "./transaction.service"


const addMoney = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as JwtPayload;

  const sendMoneyData = await TransactionServices.addMoney({
    userId: user.userId,
    amount: req.body.amount,
    description: req.body.description,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Money Added Successfully",
    data: sendMoneyData
  })
})
const sendMoney = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as JwtPayload;

  const sendMoneyData = await TransactionServices.sendMoney({
    senderId: user.userId,
    receiverId: req.body.receiver,
    amount: req.body.amount,
    description: req.body.description,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Send Money Successfully",
    data: sendMoneyData
  })
})

const cashIn = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as JwtPayload;

  const sendMoneyData = await TransactionServices.cashIn({
    senderId: user.userId,
    receiverId: req.body.receiver,
    amount: req.body.amount,
    description: req.body.description,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Cash In Successfully",
    data: sendMoneyData
  })
})
const cashOut = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as JwtPayload;

  const sendMoneyData = await TransactionServices.cashOut({
    senderId: user.userId,
    receiverId: req.body.receiver,
    amount: req.body.amount,
    description: req.body.description,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Cash Out Successfully",
    data: sendMoneyData
  })
})

const adminWithdraw = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as JwtPayload;

  const sendMoneyData = await TransactionServices.adminWithdraw({
    userId: user.userId,
    amount: req.body.amount,
    description: req.body.description,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Admin Withdrawal Successfully",
    data: sendMoneyData
  })
})
const getMyTransactionById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as JwtPayload;
  const {transId} = req.params;
  const result = await TransactionServices.getMyTransactionById(user.userId, transId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Transactions Retrieved Successfully",
    data: result,
  })
})
const getMyTransactions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as JwtPayload;
  const queryParams = req.query as any;
  const result = await TransactionServices.getMyTransactions(user.userId, queryParams);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Transactions Retrieved Successfully",
    data: result.transactions,
    meta: {
      page: result.pagination.currentPage,
      limit: queryParams?.limit || 10,
      totalPage: result.pagination.totalPages,
      total: result.pagination.totalTransactions
    }
  })
})
const getAllTransactions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const queryParams = (req as any).validatedQuery;
  const result = await TransactionServices.getAllTransactions(queryParams);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All Transactions Retrieved Successfully",
    data: result.transactions,
    meta: {
      page: result.pagination.currentPage,
      limit: queryParams?.limit || 10,
      totalPage: result.pagination.totalPages,
      total: result.pagination.totalTransactions
    }
  })
})
const getTransactionAnalytics = catchAsync(async (req: Request, res: Response) => {
  const analytics = await TransactionServices.getTransactionAnalytics();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Transaction analytics fetched successfully",
    data: analytics
  });
});




export const TransactionControllers = {
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