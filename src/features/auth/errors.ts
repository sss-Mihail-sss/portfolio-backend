import { AppError, ConflictError } from "../../shared/errors";

export class InvalidCredentialsError extends AppError {
  constructor() {
    super(401, "INVALID_CREDENTIALS", "Invalid credentials");
  }
}

export class EmailAlreadyTakenError extends ConflictError {
  constructor() {
    super("Email already taken");
  }

  override readonly code = "EMAIL_ALREADY_TAKEN";
}

export class SessionExpiredError extends AppError {
  constructor() {
    super(401, "SESSION_EXPIRED", "Session expired or invalid");
  }
}
