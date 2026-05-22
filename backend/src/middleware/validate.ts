import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";

export function validateBody<T>(schema: ZodType<T>) {
  return (request: Request, response: Response, next: NextFunction) => {
    try {
      request.body = schema.parse(request.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        response.status(400).json({
          message: "Dados inválidos",
          issues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message
          }))
        });
        return;
      }

      next(error);
    }
  };
}
