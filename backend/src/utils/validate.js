function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function parseOptionalPositiveInt(value) {
  if (value === undefined || value === null) return { ok: true, value: null };
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return { ok: false, value: null };
  }
  return { ok: true, value };
}

function badRequest(res, message, details) {
  return res.status(400).json({
    error: {
      code: "BAD_REQUEST",
      message,
      ...(details ? { details } : {}),
    },
  });
}

module.exports = { isNonEmptyString, parseOptionalPositiveInt, badRequest };
