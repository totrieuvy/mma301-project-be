const express = require("express");
const db = require("../models/index");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const brandRoute = express.Router();

/**
 * @swagger
 * tags:
 *   name: Brands
 *   description: API for brands
 */

/**
 * @swagger
 * /api/brands:
 *   get:
 *     tags:
 *       - Brands
 *     summary: Get all brands
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Brand'
 *       403:
 *         description: Forbidden, user does not have permission
 *       500:
 *         description: Internal server error
 */
brandRoute.get("/", async (req, res) => {
  try {
    const brands = await db.Brand.find();
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/brands/{id}:
 *   get:
 *     tags:
 *       - Brands
 *     summary: Get a brand by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the brand
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Brand'
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Internal server error
 */

brandRoute.get("/:id", async (req, res) => {
  try {
    const brand = await db.Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    res.status(200).json(brand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/brands:
 *   post:
 *     tags:
 *       - Brands
 *     summary: Create a new brand
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Brand'
 *     responses:
 *       201:
 *         description: Brand created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Brand'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden, user does not have permission
 *       500:
 *         description: Internal server error
 * components:
 *   schemas:
 *     Brand:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         contact:
 *           type: string
 *       required:
 *         - name
 *         - contact
 *       example:
 *         name: Brand 1
 *         contact: 1234567890
 */
brandRoute.post("/", authMiddleware, roleMiddleware(["admin", "manager"]), async (req, res) => {
  const brand = new db.Brand({
    name: req.body.name,
    contact: req.body.contact,
  });

  try {
    const newBrand = await brand.save();
    res.status(201).json(newBrand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/brands/{id}:
 *   put:
 *     tags:
 *       - Brands
 *     summary: Update a brand by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the brand
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Brand'
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Brand'
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Internal server error
 * components:
 *   schemas:
 *     Brand:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         contact:
 *           type: string
 *       required:
 *         - name
 *         - contact
 *       example:
 *         name: Brand 1
 *         contact: 1234567890
 */
brandRoute.put("/:id", authMiddleware, roleMiddleware(["admin", "manager"]), async (req, res) => {
  try {
    const brand = await db.Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    brand.name = req.body.name;
    brand.contact = req.body.contact;

    const updatedBrand = await brand.save();
    res.status(200).json(updatedBrand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/brands/{id}:
 *   delete:
 *     tags:
 *       - Brands
 *     summary: Delete a brand by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the brand
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Internal server error
 */
brandRoute.delete("/:id", authMiddleware, roleMiddleware(["admin", "manager"]), async (req, res) => {
  try {
    const brand = await db.Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const products = await db.Product.find({ brand: req.params.id });
    if (products.length > 0) {
      return res.status(400).json({ message: "Brand cannot be deleted!!!" });
    } else {
      await db.Brand.findByIdAndUpdate(req.params.id, { status: false });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = brandRoute;
