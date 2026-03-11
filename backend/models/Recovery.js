const mongoose = require("mongoose");

const recoverySchema = new mongoose.Schema(
  {
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    quarter: { type: String, required: true },
    deficit: { type: Number, default: 0 },
  },
  { timestamps: true }
);

recoverySchema.index({ recruiterId: 1, quarter: 1 }, { unique: true });

module.exports = mongoose.model("Recovery", recoverySchema);
