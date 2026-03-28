const mongoose = require("mongoose");

const incentiveClaimSchema = new mongoose.Schema(
  {
    joinerId: { type: mongoose.Schema.Types.ObjectId, ref: "Joiner", required: true },
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    incentiveType: { type: String, enum: ["CTH", "FTH", "FTE", "ANN"], required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "not_eligible"],
      default: "pending",
    },
    claimMonth: { type: String, required: true },
    monthPaid: { type: String },
    incentiveAmount: { type: Number, default: 0 },
    managerNote: {
      type: String,
      trim: true,
      required: function requireReasonForRejections() {
        return ["rejected", "not_eligible"].includes(this.status);
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("IncentiveClaim", incentiveClaimSchema);
