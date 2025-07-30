import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

export const validateQuery = (zodSchema: ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedQuery = await zodSchema.parseAsync(req.query);
        // Store validated query in a custom property
        (req as any).validatedQuery = validatedQuery;
        next();
    } catch (error) {
        next(error);
    }
};
