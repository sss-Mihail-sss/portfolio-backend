import { Elysia, NotFound, ParseError, ValidationError } from "elysia";

import { AppError } from "../shared/errors";

// Elysia 2.0: the error context no longer has `code` — built-in failures are
// matched by error class instead. "global" so the hook also covers routes
// registered by sibling plugins (features mounted through the router).
export const errorPlugin = new Elysia({ name: "plugin/error" }).error(
  "global",
  ({ error, status }) => {
    if (error instanceof AppError) {
      return status(error.status, { code: error.code, message: error.message });
    }

    if (error instanceof ValidationError) {
      return status(422, { code: "VALIDATION_ERROR", message: error.message });
    }

    if (error instanceof NotFound) {
      return status(404, { code: "NOT_FOUND", message: "Not found" });
    }

    if (error instanceof ParseError) {
      return status(400, { code: "PARSE_ERROR", message: "Failed to parse request" });
    }

    return status(500, { code: "INTERNAL_ERROR", message: "Internal server error" });
  },
);
