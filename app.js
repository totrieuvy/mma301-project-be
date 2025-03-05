var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors");
require("dotenv").config();
const setupSwagger = require("./utils/swagger");

const db = require("./models/index");
db.connectDb().catch(console.error);

var indexRouter = require("./index");
var usersRouter = require("./routes/users");
const authenticationRoute = require("./routes/authenticationRoute");
const categoryRoute = require("./routes/categoryRoute");
const skinRoute = require("./routes/skinRoute");
const brandRoute = require("./routes/brandRoute");
const productRoute = require("./routes/productRoute");
const dashboardRoute = require("./routes/dashboardRoute");
const managerRoute = require("./routes/managerRoute");
const orderRoute = require("./routes/orderRoute");
const customerRoute = require("./routes/customerRoute");
const feedbackRoute = require("./routes/feedbackRoute");
const promotionRoute = require("./routes/promotionRoute");
const quizRoute = require("./routes/quizRoute");
const routineRoute = require("./routes/routineRoute");
const accountRoute = require("./routes/accountRoute");

var app = express();
app.use(cors());

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api", authenticationRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/skins", skinRoute);
app.use("/api/brands", brandRoute);
app.use("/api/products", productRoute);
app.use("/api/manager", managerRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/order", orderRoute);
app.use("/api/customers", customerRoute);
app.use("/api/feedback", feedbackRoute);
app.use("/api/promotion", promotionRoute);
app.use("/api/quiz", quizRoute);
app.use("/api/routine", routineRoute);
app.use("/api/account", accountRoute);

setupSwagger(app);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

const HOST_NAME = process.env.HOST_NAME;
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
