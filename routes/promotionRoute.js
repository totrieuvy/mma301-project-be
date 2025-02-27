const express = require("express");
const Promotion = require("../models/promotion.model");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Promotion
 *   description: API quản lý khuyến mãi
 */

/**
 * @swagger
 * /api/promotions:
 *   get:
 *     summary: Lấy danh sách tất cả các chương trình khuyến mãi
 *     tags: [Promotion]
 *     responses:
 *       200:
 *         description: Danh sách các chương trình khuyến mãi được trả về thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Promotion'
 *       500:
 *         description: Lỗi server.
 */
router.get("/", async (req, res) => {
  try {
    const promotions = await Promotion.find();
    res.status(200).json(promotions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/promotions/{id}:
 *   get:
 *     summary: Lấy chi tiết chương trình khuyến mãi theo ID
 *     tags: [Promotion]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của chương trình khuyến mãi
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết chương trình khuyến mãi được trả về.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Promotion'
 *       404:
 *         description: Chương trình khuyến mãi không tồn tại.
 *       500:
 *         description: Lỗi server.
 */
router.get("/:id", async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }
    res.status(200).json(promotion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/promotions:
 *   post:
 *     summary: Tạo mới một chương trình khuyến mãi
 *     tags: [Promotion]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã khuyến mãi (phải là duy nhất).
 *                 example: "SAVE20"
 *               discount:
 *                 type: number
 *                 description: Giá trị giảm giá.
 *                 example: 20
 *               createBy:
 *                 type: string
 *                 description: ID của tài khoản tạo chương trình khuyến mãi.
 *                 example: "64f8a6d123abc4567e891011"
 *               expiredAt:
 *                 type: string
 *                 format: date-time
 *                 description: Thời gian hết hạn.
 *                 example: "2025-12-31T23:59:59.000Z"
 *               status:
 *                 type: boolean
 *                 description: Trạng thái kích hoạt của chương trình khuyến mãi.
 *                 example: true
 *     responses:
 *       201:
 *         description: Chương trình khuyến mãi được tạo thành công.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Promotion'
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ.
 *       500:
 *         description: Lỗi server.
 */
router.post("/", async (req, res) => {
  try {
    const promotion = new Promotion(req.body);
    const savedPromotion = await promotion.save();
    res.status(201).json(savedPromotion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/promotions/{id}:
 *   put:
 *     summary: Cập nhật thông tin chương trình khuyến mãi theo ID
 *     tags: [Promotion]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của chương trình khuyến mãi cần cập nhật.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã khuyến mãi.
 *                 example: "SAVE25"
 *               discount:
 *                 type: number
 *                 description: Giá trị giảm giá.
 *                 example: 25
 *               createBy:
 *                 type: string
 *                 description: ID của tài khoản tạo chương trình khuyến mãi.
 *                 example: "64f8a6d123abc4567e891011"
 *               expiredAt:
 *                 type: string
 *                 format: date-time
 *                 description: Thời gian hết hạn.
 *                 example: "2026-12-31T23:59:59.000Z"
 *               status:
 *                 type: boolean
 *                 description: Trạng thái kích hoạt.
 *                 example: false
 *     responses:
 *       200:
 *         description: Chương trình khuyến mãi được cập nhật thành công.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Promotion'
 *       404:
 *         description: Chương trình khuyến mãi không tồn tại.
 *       500:
 *         description: Lỗi server.
 */
router.put("/:id", async (req, res) => {
  try {
    const updatedPromotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPromotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }
    res.status(200).json(updatedPromotion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/promotions/{id}:
 *   delete:
 *     summary: Xóa chương trình khuyến mãi theo ID
 *     tags: [Promotion]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của chương trình khuyến mãi cần xóa.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chương trình khuyến mãi đã được xóa thành công.
 *       404:
 *         description: Chương trình khuyến mãi không tồn tại.
 *       500:
 *         description: Lỗi server.
 */
router.delete("/:id", async (req, res) => {
  try {
    const deletedPromotion = await Promotion.findByIdAndDelete(req.params.id);
    if (!deletedPromotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }
    res.status(200).json({ message: "Promotion deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
