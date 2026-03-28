const mongoose = require("mongoose");

const joinerSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinerId: { type: String, required: true, unique: true, index: true, trim: true },
    joinerName: { type: String, required: true },
    client: { type: String, required: true },
    skill: { type: String, required: true },
    portal: { type: String, required: true },
    joinDate: { type: Date, required: true },
    incentiveType: {
      type: String,
      enum: ["CTH", "FTH", "FTE", "ANN"],
      required: true,
    },
  },
  { timestamps: true }
);

joinerSchema.index({ joinerId: 1 }, { unique: true });

module.exports = mongoose.model("Joiner", joinerSchema);
