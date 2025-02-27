const express = require("express");
const db = require("../models/index");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const dashboardRoute = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: API for dashboard
 *
 * /api/dashboard/account:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get account statistics
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 admin:
 *                   type: object
 *                   properties:
 *                     true:
 *                       type: number
 *                     false:
 *                       type: number
 *                 manager:
 *                   type: object
 *                   properties:
 *                     true:
 *                       type: number
 *                     false:
 *                       type: number
 *                 customer:
 *                   type: object
 *                   properties:
 *                     true:
 *                       type: number
 *                     false:
 *                       type: number
 *       403:
 *         description: Forbidden, user does not have permission
 *       500:
 *         description: Internal server error
 */
dashboardRoute.get("/account", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const accountStatistics = await db.Account.aggregate([
      {
        $group: {
          _id: { role: "$role", status: "$status" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          role: "$_id.role",
          status: "$_id.status",
          count: 1,
        },
      },
    ]);

    const result = {
      admin: { true: 0, false: 0 },
      manager: { true: 0, false: 0 },
      customer: { true: 0, false: 0 },
    };

    accountStatistics.forEach((stat) => {
      if (stat.role in result) {
        result[stat.role][stat.status] = stat.count;
      }
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching account statistics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/dashboard/product:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get product statistics
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 active:
 *                   type: number
 *                 inactive:
 *                   type: number
 *       403:
 *         description: Forbidden, user does not have permission
 *       500:
 *         description: Internal server error
 */
dashboardRoute.get("/product", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const productStatistics = await db.Product.aggregate([
      {
        $group: {
          _id: { isDeleted: "$isDeleted" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          isDeleted: "$_id.isDeleted",
          count: 1,
        },
      },
    ]);

    const result = {
      active: 0,
      inactive: 0,
    };

    productStatistics.forEach((stat) => {
      if (stat.isDeleted === false) {
        result.active = stat.count;
      } else if (stat.isDeleted === true) {
        result.deleted = stat.count;
      }
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching product statistics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/dashboard/category:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get category statistics
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 active:
 *                   type: number
 *                 inactive:
 *                   type: number
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       productCount:
 *                         type: number
 *       403:
 *         description: Forbidden, user does not have permission
 *       500:
 *         description: Internal server error
 */
dashboardRoute.get("/category", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const categoryStatistics = await db.Category.aggregate([
      {
        $group: {
          _id: { status: "$status" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id.status",
          count: 1,
        },
      },
    ]);

    const productCountByCategory = await db.Product.aggregate([
      {
        $group: {
          _id: "$category",
          productCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $project: {
          _id: 0,
          category: "$category.name",
          productCount: 1,
        },
      },
    ]);

    const result = {
      active: 0,
      inactive: 0,
      categories: productCountByCategory,
    };

    categoryStatistics.forEach((stat) => {
      if (stat.status === true) {
        result.active = stat.count;
      } else if (stat.status === false) {
        result.inactive = stat.count;
      }
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching category statistics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/dashboard/brand:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get brand statistics
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 active:
 *                   type: number
 *                 inactive:
 *                   type: number
 *       403:
 *         description: Forbidden, user does not have permission
 *       500:
 *         description: Internal server error
 */
dashboardRoute.get("/brand", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const brandStatistics = await db.Brand.aggregate([
      {
        $group: {
          _id: { status: "$status" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id.status",
          count: 1,
        },
      },
    ]);

    const result = {
      active: 0,
      inactive: 0,
    };

    brandStatistics.forEach((stat) => {
      if (stat.status === true) {
        result.active = stat.count;
      } else if (stat.status === false) {
        result.inactive = stat.count;
      }
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching brand statistics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/dashboard/revenue:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get revenue statistics for a specific year
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: The year for which to retrieve revenue statistics
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRevenue:
 *                   type: number
 *                   description: The total revenue for the specified year
 *                 totalCustomers:
 *                   type: number
 *                   description: The total number of customers who made purchases in the specified year
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden, user does not have permission
 *       500:
 *         description: Internal server error
 */
dashboardRoute.get("/revenue", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ message: "Year parameter is required" });
    }

    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const orderStatistics = await db.Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: "Paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          uniqueCustomers: { $addToSet: "$account" },
        },
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
          totalCustomers: { $size: "$uniqueCustomers" },
        },
      },
    ]);

    const result = orderStatistics[0] || { totalRevenue: 0, totalCustomers: 0 };

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching revenue statistics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/dashboard/transactions:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get all transactions
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: The ID of the transaction
 *                   account:
 *                     type: string
 *                     description: The ID of the account
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         product:
 *                           type: string
 *                           description: The ID of the product
 *                         quantity:
 *                           type: number
 *                           description: The quantity of the product
 *                   totalAmount:
 *                     type: number
 *                     description: The total amount of the transaction
 *                   status:
 *                     type: string
 *                     description: The status of the transaction
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: The date and time when the transaction was created
 *       403:
 *         description: Forbidden, user does not have permission
 *       500:
 *         description: Internal server error
 */
dashboardRoute.get("/transactions", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const transactions = await db.Order.find();
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = dashboardRoute;
