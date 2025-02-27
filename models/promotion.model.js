const mongoose = require("mongoose");
const { create } = require("./account.model");
const e = require("express");

const promotionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, "Code is required"],
    unique: [true, "Code is already existed"],
  },
  discount: {
    type: Number,
    required: [true, "Discount is required"],
  },
  createBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
  },
  expiredAt: {
    type: Date,
    required: [true, "Expired date is required"],
  },
  status: {
    type: Boolean,
    default: true,
  },
});

const Promotion = mongoose.model("Promotion", promotionSchema);

module.exports = Promotion;
