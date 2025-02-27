const express = require("express");
const db = require("../models/index");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const feedbackRoute = express.Router();

/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: API endpoints for managing feedback
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Feedback:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the feedback
 *         product:
 *           type: string
 *           description: Unique identifier for the associated product
 *         content:
 *           type: string
 *           description: Feedback content provided by the user
 *         rating:
 *           type: number
 *           description: Rating score given in the feedback
 *         fromAccount:
 *           type: string
 *           description: Unique identifier of the user who submitted the feedback
 *       required:
 *         - product
 *         - content
 *         - rating
 *         - fromAccount
 */

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: Create new feedback
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product
 *               - content
 *               - rating
 *               - fromAccount
 *             properties:
 *               product:
 *                 type: string
 *               content:
 *                 type: string
 *               rating:
 *                 type: number
 *               fromAccount:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feedback created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
feedbackRoute.post("/", async (req, res) => {
  try {
    const { fromAccount, product, content, rating } = req.body;

    if (!product || !content || !rating || !fromAccount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const findProduct = await db.Product.findById(product);
    if (!findProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const feedback = new db.Feedback({
      product,
      content,
      rating,
      fromAccount,
    });
    const newFeedback = await feedback.save();
    res.status(201).json(newFeedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/feedback:
 *   get:
 *     summary: Get all feedbacks
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all feedbacks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Feedback'
 *       500:
 *         description: Internal server error
 */
feedbackRoute.get("/", async (req, res) => {
  try {
    const feedbacks = await db.Feedback.find();
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = feedbackRoute;
