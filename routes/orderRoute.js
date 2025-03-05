const express = require("express");
const db = require("../models/index");
const crypto = require("crypto");
const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require("vnpay");
const roleMiddleware = require("../middleware/roleMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const multer = require("multer");
const moment = require("moment");
const axios = require("axios");
const CryptoJS = require("crypto-js");

const orderRoute = express.Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, "../uploads/deliveryConfirmation");
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      cb(null, `delivery-${req.params.orderId}-${Date.now()}${path.extname(file.originalname)}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and GIF are allowed."));
    }
  },
});

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: API for orders
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         account:
 *           type: string
 *           description: The ID of the account
 *         status:
 *           type: string
 *           enum: ["Pending", "Paid"]
 *           description: The status of the order
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *                 description: The ID of the product
 *               quantity:
 *                 type: number
 *                 description: The quantity of the product
 *         totalAmount:
 *           type: number
 *           description: The total amount of the order
 *       required:
 *         - account
 *         - status
 *         - items
 *         - totalAmount
 */

/**
 * @swagger
 * /api/order/add-to-cart:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Create a pending order with VNPAY payment URL
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account:
 *                 type: string
 *                 description: The account ID
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                       description: The product ID
 *                     quantity:
 *                       type: number
 *                       description: The quantity of the product
 *     responses:
 *       201:
 *         description: VNPAY payment URL created successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
orderRoute.post("/add-to-cart", authMiddleware, async (req, res) => {
  try {
    const { account, items } = req.body;

    if (!account || !items || items.length === 0) {
      return res.status(400).json({ message: "An order must contain at least one product." });
    }

    const accountDetails = await db.Account.findById(account).select("email").exec();
    if (!accountDetails) {
      return res.status(404).json({ message: "Account not found." });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await db.Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${item.product} not found.` });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`,
        });
      }

      totalAmount += item.quantity * product.price;
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
      });
    }

    const newOrder = new db.Order({
      account,
      items: orderItems,
      totalAmount,
      status: "Pending", // Set initial status to Pending
      imageConfirmDelivered: null,
    });

    await newOrder.save();

    const vnpay = new VNPay({
      tmnCode: "9TKDVWYK",
      secureSecret: "LH6SD44ECTBWU1PHK3D2YCOI5HLUWGPH",
      vnpayHost: "https://sandbox.vnpayment.vn",
      testMode: true,
      hashAlgorithm: "SHA512",
      enableLog: true,
      loggerFn: console.log,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const vnpayResponse = await vnpay.buildPaymentUrl({
      vnp_Amount: totalAmount, // Convert to cents
      vnp_IpAddr: "127.0.0.1",
      vnp_TxnRef: newOrder._id.toString(),
      vnp_OrderInfo: `Thanh toan don hang ${newOrder._id}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: `exp://192.168.1.4:8081/--/cart?orderId=${newOrder._id}`, // Deep link return URL
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    return res.status(201).json({
      orderId: newOrder._id,
      vnpayResponse,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

/**
 * @swagger
 * /api/order/confirm-payment/{orderId}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Confirm order payment and finalize order
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to confirm
 *       - in: query
 *         name: vnp_ResponseCode
 *         required: true
 *         schema:
 *           type: string
 *         description: The response code from VNPAY to confirm payment status
 *     responses:
 *       200:
 *         description: Payment confirmed and order finalized
 *       400:
 *         description: Invalid order or payment
 *       500:
 *         description: Server error
 */
orderRoute.get("/confirm-payment/:orderId", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { vnp_ResponseCode } = req.query;

    // Check if payment was successful
    if (vnp_ResponseCode !== "00") {
      return res.redirect(`exp://192.168.1.4:8081/--/cart?status=error&message=Payment%20unsuccessful`);
    }

    const order = await db.Order.findById(orderId).populate("items.product");

    if (!order) {
      return res.redirect(`exp://192.168.1.4:8081/--/cart?status=error&message=Order%20not%20found`);
    }

    if (order.status !== "Pending") {
      return res.redirect(`exp://192.168.1.4:8081/--/cart?status=error&message=Order%20already%20processed`);
    }

    // Update order status to Paid
    order.status = "Paid";
    await order.save();

    // Reduce product quantities
    for (const item of order.items) {
      const product = await db.Product.findById(item.product._id);
      if (product) {
        product.quantity -= item.quantity;
        await product.save();
      }
    }

    // Redirect to success page
    return res.redirect(`exp://192.168.1.4:8081/--/cart?status=success&orderId=${orderId}`);
  } catch (error) {
    console.error("Confirm Payment Error:", error);
    return res.redirect(`exp://192.168.1.4:8081/--/cart?status=error&message=${encodeURIComponent(error.message)}`);
  }
});

/**
 * @swagger
 * /api/order/update-shipping/{orderId}:
 *   patch:
 *     tags:
 *       - Orders
 *     summary: Update order status to Shipping
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order status updated to Shipping
 *       400:
 *         description: Invalid order status
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
orderRoute.patch("/update-shipping/:orderId", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await db.Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.status !== "Paid") {
      return res.status(400).json({ message: "Only paid orders can be marked as shipping." });
    }

    order.status = "Shipping";
    await order.save();

    return res.status(200).json({
      message: "Order status updated to Shipping.",
      orderId: order._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

/**
 * @swagger
 * /api/order/confirm-delivery/{orderId}:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Confirm order delivery with image
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               deliveryImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Delivery confirmed and order status updated
 *       400:
 *         description: Invalid order status or missing image
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
orderRoute.post("/confirm-delivery/:orderId", authMiddleware, upload.single("deliveryImage"), async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await db.Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.status !== "Shipping") {
      return res.status(400).json({ message: "Only shipping orders can be confirmed as delivered." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Delivery confirmation image is required." });
    }

    // Save the image path
    const baseUrl = "https://mma301-project-be.onrender.com";
    order.imageConfirmDelivered = `${baseUrl}/uploads/deliveryConfirmation/${req.file.filename}`;

    order.status = "Delivered";
    await order.save();

    return res.status(200).json({
      message: "Order delivery confirmed.",
      orderId: order._id,
      imagePath: `https://mma301-project-be.onrender.com${order.imageConfirmDelivered}`,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

/**
 * @swagger
 * /api/order/account/{id}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get orders by account ID
 *     description: Retrieve all orders for a specific account by account ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the account
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Account not found
 *       500:
 *         description: Internal server error
 */
orderRoute.get("/account/:id", authMiddleware, roleMiddleware(["customer"]), async (req, res) => {
  try {
    const orders = await db.Order.find({ account: req.params.id });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

/**
 * @swagger
 * /api/order/add-balance:
 *   patch:
 *     tags:
 *       - Orders
 *     summary: Add balance to an account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account:
 *                 type: string
 *                 description: The account ID
 *                 example: "64f8a6d123abc4567e891011"
 *               amount:
 *                 type: number
 *                 description: The amount to add to the balance
 *                 example: 100
 *     responses:
 *       200:
 *         description: Balance added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Balance added successfully."
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Account not found
 *       500:
 *         description: Internal server error
 */
orderRoute.patch("/add-balance", async (req, res) => {
  try {
    const { account, amount } = req.body;

    if (!account || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid request." });
    }

    const accountDetails = await db.Account.findById(account).select("balance").exec();
    if (!accountDetails) {
      return res.status(404).json({ message: "Account not found." });
    }

    accountDetails.balance += amount;
    await accountDetails.save();

    res.status(200).json({ message: "Balance added successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

/**
 * @swagger
 * /api/order/cancel-order/{orderId}:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Cancel an order by ID
 *     description: Cancel an order and refund 50% of the total amount to the customer's account.
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to be canceled
 *     responses:
 *       200:
 *         description: Order canceled and 50% refund issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Order has been canceled and 50% refund issued. Product quantities have been updated in the inventory."
 *                 refundAmount:
 *                   type: number
 *                   description: The amount refunded to the customer's account
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
orderRoute.post("/cancel-order/:orderId", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await db.Order.findById(orderId).populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (order.status !== "Paid") {
      return res.status(400).json({ message: "Only paid orders can be canceled." });
    } else {
      const refundAmount = order.totalAmount * 0.5;

      const account = await db.Account.findById(order.account);
      account.balance += refundAmount;
      await account.save();

      const adminAccount = await db.Account.findOne({ role: "admin" });
      if (adminAccount) {
        adminAccount.balance += refundAmount;
        await adminAccount.save();
      }

      for (const item of order.items) {
        const product = await db.Product.findById(item.product._id);
        if (product) {
          product.quantity += item.quantity;
          await product.save();
        }

        order.status = "Canceled";
        await order.save();

        const formattedItems = order.items.map((item) => ({
          productName: item.product?.name || "Unknown Product",
          quantity: item.quantity,
          price: item.product?.price || 0,
          total: item.quantity * item.product?.price || 0,
        }));
        const emailTemplatePath = path.join(__dirname, "../templates/refundTemplate.html");
        const emailTemplateSource = fs.readFileSync(emailTemplatePath, "utf8");
        const emailTemplate = handlebars.compile(emailTemplateSource);
        const emailHtml = emailTemplate({ orderId, refundAmount, items: formattedItems });

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: account.email,
          subject: "Xác nhận hoàn tiền đơn hàng",
          html: emailHtml,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) console.error("Lỗi gửi email:", error);
          else console.log("Email sent:", info.response);
        });

        return res.status(200).json({
          message: "Đơn hàng đã được hủy và hoàn tiền 50%. Số lượng sản phẩm đã được cập nhật vào kho.",
          refundAmount,
        });
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
});

/**
 * @swagger
 * /api/order/shipper-orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get orders for shipper (Paid, Shipping, Delivered)
 *     responses:
 *       200:
 *         description: List of orders for shipper
 *       500:
 *         description: Server error
 */
orderRoute.get("/shipper-orders", authMiddleware, roleMiddleware(["admin", "shipper"]), async (req, res) => {
  try {
    const orders = await db.Order.find({
      status: { $in: ["Paid", "Shipping", "Delivered"] },
    })
      .populate({
        path: "items.product",
        select: "name price", // Only select necessary product details
      })
      .sort({
        status: 1, // Sort by status, Paid will come first
        createdAt: -1, // Then by most recent
      });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

module.exports = orderRoute;
