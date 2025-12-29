function notFoundJson(req, res, next) {
  if (req.path && req.path.startsWith("/api/")) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Not found" },
    });
  }
  return next();
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (req.path && req.path.startsWith("/api/")) {
    const status = Number.isInteger(err.statusCode)
      ? err.statusCode
      : Number.isInteger(err.status)
      ? err.status
      : 500;

    return res.status(status).json({
      error: {
        code: status >= 500 ? "INTERNAL_ERROR" : "ERROR",
        message: status >= 500 ? "Internal server error" : err.message,
      },
    });
  }

  return res.status(500).send("Internal Server Error");
}

module.exports = { notFoundJson, errorHandler };
