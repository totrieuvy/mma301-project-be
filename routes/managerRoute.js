const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../models/index");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const managerRoute = express.Router();

/**
 * @swagger
 * tags:
 *   name: Managers
 *   description: API for managers
 *
 * /api/manager:
 *   get:
 *     tags:
 *       - Managers
 *     summary: Get all managers
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Account'
 *       403:
 *         description: Forbidden, user does not have permission
 *       500:
 *         description: Internal server error
 */
managerRoute.get("/", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const managers = await db.Account.find({ role: "manager" });
    if (!managers) {
      return res.status(404).json({ message: "No manager found" });
    }

    const managersWithoutPassword = managers.map((manager) => {
      const { password, ...managerWithoutPassword } = manager.toObject();
      return managerWithoutPassword;
    });
    res.status(200).json(managersWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/manager/{id}:
 *   get:
 *     tags:
 *       - Managers
 *     summary: Get a manager by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the manager
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 *       404:
 *         description: Manager not found
 *       500:
 *         description: Internal server error
 */
managerRoute.get("/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const manager = await db.Account.findById(req.params.id);
    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    const { password, ...managerWithoutPassword } = manager.toObject();
    res.status(200).json(managerWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/manager:
 *   post:
 *     tags:
 *       - Managers
 *     summary: Create a new manager
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       201:
 *         description: Manager created successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden, user does not have permission
 *       500:
 *         description: Internal server error
 */
managerRoute.post("/", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    // Validate required fields
    const { email, phone, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ message: "Email, password and username are required" });
    }

    // Check if email already exists
    const existingUser = await db.Account.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new manager
    const manager = new db.Account({
      email,
      phone,
      password: hashedPassword,
      username,
      role: "manager",
      balance: 0,
    });

    const newManager = await manager.save();
    const managerWithoutPassword = newManager.toObject();
    delete managerWithoutPassword.password;

    res.status(201).json(managerWithoutPassword);
  } catch (error) {
    console.error("Error creating manager:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid input data" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/manager/{id}:
 *   put:
 *     tags:
 *       - Managers
 *     summary: Update a manager
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the manager
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Manager updated successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden, user does not have permission
 *       404:
 *         description: Manager not found
 *       500:
 *         description: Internal server error
 */
managerRoute.put("/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  const managerId = req.params.id;

  // Exclude the password field from the request body
  const { password, ...updateData } = req.body;

  try {
    const updatedManager = await db.Account.findByIdAndUpdate(managerId, updateData, { new: true });

    if (!updatedManager || updatedManager.role !== "manager") {
      return res.status(404).json({ message: "Manager not found" });
    }

    res.status(200).json(updatedManager);
  } catch (error) {
    console.error("Error updating manager:", error);
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/manager/{id}:
 *   delete:
 *     tags:
 *       - Managers
 *     summary: Delete a manager
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the manager
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *       404:
 *         description: Manager not found
 *       500:
 *         description: Internal server error
 */
managerRoute.delete("/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const manager = await db.Account.findById(req.params.id);
    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }
    await db.Account.findByIdAndUpdate(req.params.id, { status: false });
    res.status(200).json({ message: "Manager deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = managerRoute;
