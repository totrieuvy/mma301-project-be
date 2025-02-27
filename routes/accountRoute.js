const express = require("express");
const db = require("../models/index");

const accountRoute = express.Router();

/**
 * @swagger
 * tags:
 *  name: Accounts
 *  description: Account related endpoints
 *
 */

/**
 * @swagger
 * /api/account/{id}:
 *   get:
 *     summary: Get account by ID
 *     description: Retrieve an account by its unique ID.
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The unique ID of the account
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved the account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
accountRoute.get("/:id", async (req, res) => {
  try {
    const account = await db.Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = accountRoute;
