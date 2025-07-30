import { NextFunction, Request, Response } from "express"

import { envVars } from "../config/env"
import { IErrorSources } from "../interfaces/error.Types"
import AppError from "../errorHelpers/AppError"
import { handleDuplicateError } from "../helpers/handleDuplicateError"
import { handleCastError } from "../helpers/handleCastError"
import { handleZodError } from "../helpers/handleZodError"
import { handleValidationError } from "../helpers/handleValidationError"




export const globalErrorHandler = async (err: any, req: Request, res: Response, next: NextFunction) => {
    
 
    let errorSources: IErrorSources[] = []

    let statusCode = 500
    let message = `Something went wrong!!`

    if (err.code === 1100) {
        const simplifiedError = handleDuplicateError(err)
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message
    }
    else if (err.name === "CastError") {
        const simplifiedError = handleCastError(err)
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message
    }
    else if (err.name === "ZodError") {
        const simplifiedError = handleZodError(err)
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message
        errorSources = simplifiedError.errorSources as IErrorSources[]
    }
    else if (err.name === "ValidationError") {
        const simplifiedError = handleValidationError(err)
        statusCode = simplifiedError.statusCode;
        errorSources = simplifiedError.errorSources as IErrorSources[]
        message = simplifiedError.message
    }
    else if (err instanceof AppError) {
        statusCode = err.statusCode
        message = err.message
    } else if (err instanceof Error) {
        statusCode = 500
        message = err.message
    }

    res.status(statusCode).json({
        success: false,
        message,
        errorSources,
        err: envVars.NODE_ENV === "development" ? err : null,
        stack: envVars.NODE_ENV === "development" ? err.stack : null,
    })
}