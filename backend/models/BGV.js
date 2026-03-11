const mongoose = require("mongoose");

const bgvSchema = new mongoose.Schema(
  {
    joinerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Joiner",
      unique: true,
      required: true,
    },
    bgvStatus: {
      type: String,
      enum: ["pending", "cleared", "failed"],
      default: "pending",
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BGV", bgvSchema);
