class AppError extends Error {
  constructor(
    name,
    message,
    explaination,
    statusCode
  ) {
    super();
    this.name = name;
    this.message = message;
    this.explaination = explaination;
    this.statusCode = statusCode;
  }
}

module.exports = AppError;
