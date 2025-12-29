function getExpiryNowMs(req) {
  if (process.env.TEST_MODE !== "1") return Date.now();

  const headerVal = req.header("x-test-now-ms");
  if (!headerVal) return Date.now();

  const parsed = Number(headerVal);
  if (!Number.isFinite(parsed) || parsed <= 0) return Date.now();

  return parsed;
}

module.exports = { getExpiryNowMs };
