import { catchAsync } from "../../utils/catchAsync"
import { sendResponse } from "../../utils/sendResponse"
import { Request, Response, NextFunction } from "express"
import httpStatus from "http-status-codes"
import { UserServices } from "./user.service"
import { JwtPayload } from "jsonwebtoken"

const createUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserServices.createUser(req.body)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "User Created Successfully",
        data: user
    })
})

const getAllUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const queryParams = (req as any).validatedQuery;
    const result = await UserServices.getAllUsers(queryParams)
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Users fetched successfully",
        data: result.users,
        meta: {
            page: result.pagination.currentPage,
            limit: queryParams?.limit || 10,
            totalPage: result.pagination.totalPages,
            total: result.pagination.totalUsers
        }
    })
})

const getMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload
    const user = await UserServices.getMe(decodedToken.userId)
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User profile fetched successfully",
        data: user
    })
})

const getSingleUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserServices.getSingleUser(req.params.id)
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User fetched successfully",
        data: user
    })
})

const updateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;

    const verifiedToken = req.user;

    const payload = req.body;
    const user = await UserServices.updateUser(userId, payload, verifiedToken as JwtPayload)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User updated successfully",
        data: user
    })
})

const makeUserAgent = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const result = (await UserServices.makeUserAgent(userId));
  

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User has been made an Agent",
    data: result,
  });
});


const suspendAgent = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const result = await UserServices.suspendAgent(userId);

  res.status(httpStatus.OK).json({
    success: true,
    message: "Agent approval has been suspended",
    data: result,
  });
});
const searchUserByEmail = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.params;
  const result = await UserServices.searchUserByEmail(email);

  res.status(httpStatus.OK).json({
    success: true,
    message: "User founded",
    data: result,
  });
});
const searchAgentByEmail = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.params;
  const result = await UserServices.searchAgentByEmail(email);

  res.status(httpStatus.OK).json({
    success: true,
    message: "Agent founded",
    data: result,
  });
});

export const UserController = {
    createUser,
    getAllUsers,
    getMe,
    getSingleUser,
    updateUser,
    makeUserAgent,
    suspendAgent,
    searchUserByEmail,
    searchAgentByEmail
}
