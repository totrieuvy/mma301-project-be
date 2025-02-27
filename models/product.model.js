const mongoose = require("mongoose");

const ProductSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required!!!"],
    },
    description: {
      type: String,
      required: [true, "Product description is required!!!"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required!!!"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required!!!"],
    },
    image: {
      type: String,
      required: [true, "Product image is required!!!"],
    },
    suitableSkin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skin",
      required: [true, "Suitable skin is required!!!"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required!!!"],
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "Product brand is required!!!"],
    },
    createBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", ProductSchema);

module.exports = Product;
