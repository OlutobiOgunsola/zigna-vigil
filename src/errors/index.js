class BaseError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.code = 500;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends BaseError {
  constructor(message) {
    super(message);
    this.code = 400;
  }
}

class ClientError extends BaseError {
  constructor(message) {
    super(message);
    this.code = 400;
  }
}

class UnauthorizedError extends BaseError {
  constructor(message) {
    super(message);
    this.code = 401;
  }
}

class ForbiddenError extends BaseError {
  constructor(message) {
    super(message);
    this.code = 403;
  }
}

class NotFoundError extends BaseError {
  constructor(message) {
    super(message);
    this.code = 404;
  }
}

class UnprocessableError extends BaseError {
  constructor(message) {
    super(message);
    this.code = 422;
  }
}

class ApiRateLimitError extends BaseError {
  constructor(message) {
    super(message);
    this.code = 429;
  }
}

module.exports = {
  BaseError,
  ValidationError,
  ClientError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  UnprocessableError,
  ApiRateLimitError,
};
