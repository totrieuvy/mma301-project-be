const mongoose = require("mongoose");
const { create } = require("./account.model");

const SkinSchema = mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, "Skin type is required!!!"],
    },
    createBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Skin = mongoose.model("Skin", SkinSchema);

module.exports = Skin;
