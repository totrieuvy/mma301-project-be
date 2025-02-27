const mongoose = require("mongoose");

const BrandSchema = mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"] },
    contact: { type: String, required: [true, "Contact is required"] },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Brand = mongoose.model("Brand", BrandSchema);

module.exports = Brand;
