const express = require("express");
const db = require("../models/index");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const skinRoute = express.Router();

/**
 * @swagger
 * /api/skins:
 *   get:
 *     tags:
 *       - Skins
 *     summary: Get all skins
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Skin'
 *       500:
 *         description: Internal server error
 */
skinRoute.get("/", async (req, res) => {
  try {
    const skins = await db.Skin.find();
    res.status(200).json(skins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/skins/{id}:
 *   get:
 *     tags:
 *       - Skins
 *     summary: Get a skin by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the skin
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Skin'
 *       404:
 *         description: Skin not found
 *       500:
 *         description: Internal server error
 */
skinRoute.get("/:id", async (req, res) => {
  try {
    const skin = await db.Skin.findById(req.params.id);
    if (!skin) {
      return res.status(404).json({ message: "Skin not found" });
    }
    res.status(200).json(skin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/skins:
 *   post:
 *     tags:
 *       - Skins
 *     summary: Create a new skin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Skin created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
skinRoute.post("/", authMiddleware, roleMiddleware(["admin", "manager"]), async (req, res) => {
  console.log("Authorization header:", req.headers.authorization);
  const skin = new db.Skin({
    type: req.body.type,
    createBy: req.user._id,
  });

  try {
    const savedSkin = await skin.save();
    res.status(201).json(savedSkin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/skins/{id}:
 *   put:
 *     tags:
 *       - Skins
 *     summary: Update a skin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The skin ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Skin updated successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
skinRoute.put("/:id", authMiddleware, roleMiddleware(["admin", "manager"]), async (req, res) => {
  try {
    const skin = await db.Skin.findById(req.params.id);
    skin.type = req.body.type;
    skin.createBy = req.user._id;

    const updatedSkin = await skin.save();
    res.status(200).json(updatedSkin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/skins/{id}:
 *   delete:
 *     tags:
 *       - Skins
 *     summary: Delete a skin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The skin ID
 *     responses:
 *       200:
 *         description: Skin deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
skinRoute.delete("/:id", authMiddleware, roleMiddleware(["admin", "manager"]), async (req, res) => {
  try {
    const skin = await db.Skin.findById(req.params.id);
    if (!skin) {
      return res.status(404).json({ message: "Skin not found" });
    } else {
      const products = await db.Product.find({ suitableSkin: req.params.id });
      if (products.length > 0) {
        return res.status(400).json({ message: "Skin cannot be deleted!!!" });
      } else {
        await db.Skin.findByIdAndUpdate(req.params.id, { status: false });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = skinRoute;
