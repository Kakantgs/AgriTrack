import { ZodError } from "zod";
export function validateBody(schema) {
    return (request, response, next) => {
        try {
            request.body = schema.parse(request.body);
            next();
        }
        catch (error) {
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
