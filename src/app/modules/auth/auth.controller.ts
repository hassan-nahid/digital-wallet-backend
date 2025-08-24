import AppError from "../../errorHelpers/AppError"
import { catchAsync } from "../../utils/catchAsync"
import { sendResponse } from "../../utils/sendResponse"
import { setAuthCookie } from "../../utils/setCookie"
import { Request, Response, NextFunction } from "express"
import httpStatus from "http-status-codes"
import { AuthServices } from "./auth.service"
import { JwtPayload } from "jsonwebtoken"



const credentialsLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const loginInfo = await AuthServices.credentialsLogin(req.body);

    setAuthCookie(res, {
      accessToken: loginInfo.accessToken,
      refreshToken: loginInfo.refreshToken,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User Logged In Successfully",
      data: loginInfo,
    });
  }
);

export const AuthController = {
  credentialsLogin,
};

const getNewAccessToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    throw new AppError(httpStatus.BAD_REQUEST, "No refresh token recieved from cookies")
  }
  const tokenInfo = await AuthServices.getNewAccessToken(refreshToken as string)

  // res.cookie("accessToken", tokenInfo.accessToken, {
  //     httpOnly: true,
  //     secure: false
  // })

  setAuthCookie(res, tokenInfo);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "New Access Token Retrived Successfully",
    data: tokenInfo,
  })
})
const logout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax"
  })
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax"
  })

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User Logged Out Successfully",
    data: null,
  })
})
const changePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

  const {oldPassword, newPassword} = req.body
  const decodedToken = req.user

  await AuthServices.changePassword(oldPassword, newPassword, decodedToken as JwtPayload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Password Changed Successfully",
    data: null,
  })
})

export const AuthControllers = {
  credentialsLogin,
  getNewAccessToken,
  logout,
  changePassword,

}