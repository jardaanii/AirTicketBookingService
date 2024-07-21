const { StatusCodes } = require("http-status-codes");

class ServiceError extends Error {

  constructor(
    message,
    explaination,
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR
  ) {
    super();
    this.name = "ServiceError";
    this.message = message;
    this.explaination = explaination;
    this.statusCode = statusCode
  }
}

module.exports = ServiceError;
