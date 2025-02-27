const mongoose = require("mongoose");

const Account = require("./account.model");
const Category = require("./category.model");
const Product = require("./product.model");
const Skin = require("./skin.model");
const Brand = require("./brand.model");
const Order = require("./order.model");
const Feedback = require("./feedback.model");

const db = {};

db.mongoose = mongoose; // Thêm dòng này để có thể truy cập mongoose instance
db.Account = Account;
db.Category = Category;
db.Product = Product;
db.Skin = Skin;
db.Brand = Brand;
db.Order = Order;
db.Feedback = Feedback;

db.connectDb = async () => {
  try {
    // Thêm log để kiểm tra URI đang được sử dụng
    console.log("Connecting to database with URI:", process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI);

    // Log tên database sau khi kết nối thành công
    console.log("Connected to database:", mongoose.connection.name);

    // Thêm event listener để theo dõi trạng thái kết nối
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

// Thêm hàm để đóng kết nối
db.closeDb = async () => {
  try {
    await mongoose.disconnect();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
};

module.exports = db;
