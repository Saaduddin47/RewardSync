const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err?.code === 11000 && err?.keyPattern?.joinerId) {
    return res.status(400).json({ message: "JoinerID already exists" });
  }

  return res.status(err.statusCode || 500).json({
    message: err.message || "Internal server error",
  });
};

module.exports = errorHandler;
