const express = require("express");
const db = require("../models/index");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const bcrypt = require("bcryptjs");

const customerRoute = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The unique identifier of the customer
 *           example: "64fcb2310d3e4b001c9e8b9b"
 *         email:
 *           type: string
 *           description: The email of the customer
 *           example: "customer@example.com"
 *         phone:
 *           type: string
 *           description: The phone number of the customer
 *           example: "1234567890"
 *         username:
 *           type: string
 *           description: The username of the customer
 *           example: "customer123"
 *         role:
 *           type: string
 *           description: The role of the customer
 *           example: "customer"
 *         status:
 *           type: boolean
 *           description: The status of the customer (active/inactive)
 *           example: true
 */

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: API for managing customers
 */

/**
 * @swagger
 * /api/customers:
 *   get:
 *     tags:
 *       - Customers
 *     summary: Get all customers
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Customer'
 *       500:
 *         description: Internal server error
 */
customerRoute.get("/", authMiddleware, roleMiddleware(["admin", "manager"]), async (req, res) => {
  try {
    const customers = await db.Account.find({ role: "customer" });
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     tags:
 *       - Customers
 *     summary: Get a customer by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the customer
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
customerRoute.get("/:id", authMiddleware, roleMiddleware(["admin", "manager"]), async (req, res) => {
  try {
    const customer = await db.Account.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/customers:
 *   post:
 *     tags:
 *       - Customers
 *     summary: Create a new customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Customer'
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
 */
customerRoute.post("/", authMiddleware, roleMiddleware(["admin", "manager"]), async (req, res) => {
  try {
    const { email, phone, password, username } = req.body;
    const existingCustomer = await db.Account.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const customer = new db.Account({ email, phone, username, password: hashedPassword, role: "customer", balance: 0 });
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     tags:
 *       - Customers
 *     summary: Update a customer by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Customer'
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
customerRoute.put("/:id", authMiddleware, roleMiddleware(["admin", "manager"]), async (req, res) => {
  try {
    const { email, phone, password, username } = req.body;
    const customer = await db.Account.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    customer.email = email;
    customer.phone = phone;
    customer.username = username;
    if (password) {
      customer.password = await bcrypt.hash(password, 10);
    }
    const updatedCustomer = await customer.save();
    res.status(200).json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     tags:
 *       - Customers
 *     summary: Delete a customer by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the customer
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
customerRoute.delete("/:id", authMiddleware, roleMiddleware(["admin", "manager"]), async (req, res) => {
  try {
    const customer = await db.Account.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    } else {
      await db.Account.findByIdAndUpdate(req.params.id, { status: false });
    }

    res.status(200).json({ message: "Customer has been deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = customerRoute;
