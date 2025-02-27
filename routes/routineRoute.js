const express = require("express");
const Routine = require("../models/routine.model");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Routine
 *   description: API cho quản lý routine chăm sóc skin
 */

/**
 * @swagger
 * /api/routine:
 *   get:
 *     summary: Lấy danh sách tất cả routine
 *     tags: [Routine]
 *     responses:
 *       200:
 *         description: Danh sách routine được trả về thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Routine'
 *       500:
 *         description: Lỗi server.
 */
router.get("/", async (req, res) => {
  try {
    const routines = await Routine.find();
    res.status(200).json(routines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/routine:
 *   post:
 *     summary: Tạo một routine mới
 *     tags: [Routine]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               skin:
 *                 type: string
 *                 description: ID của skin liên quan
 *                 example: "64f8a6d123abc4567e891011"
 *               routineName:
 *                 type: string
 *                 description: Tên routine
 *                 example: "Chăm sóc ban đêm"
 *               steps:
 *                 type: array
 *                 description: Danh sách các bước trong routine
 *                 items:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: number
 *                       description: Thứ tự của bước
 *                       example: 1
 *                     description:
 *                       type: string
 *                       description: Mô tả chi tiết của bước
 *                       example: "Rửa mặt sạch sẽ"
 *     responses:
 *       201:
 *         description: Routine được tạo thành công.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Routine'
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ.
 *       500:
 *         description: Lỗi server.
 */
router.post("/", async (req, res) => {
  try {
    const { skin, routineName, steps } = req.body;
    if (!skin || !routineName || !steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ message: "skin, routineName và steps là bắt buộc." });
    }
    const newRoutine = new Routine({ skin, routineName, steps });
    const savedRoutine = await newRoutine.save();
    res.status(201).json(savedRoutine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/routine/{id}:
 *   put:
 *     summary: Cập nhật một routine theo ID
 *     tags: [Routine]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của routine cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               routineName:
 *                 type: string
 *                 description: Tên routine
 *                 example: "Chăm sóc buổi sáng"
 *               steps:
 *                 type: array
 *                 description: Danh sách các bước trong routine
 *                 items:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: number
 *                       description: Thứ tự của bước
 *                       example: 1
 *                     description:
 *                       type: string
 *                       description: Mô tả chi tiết của bước
 *                       example: "Rửa mặt"
 *     responses:
 *       200:
 *         description: Routine được cập nhật thành công.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Routine'
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ.
 *       404:
 *         description: Routine không tồn tại.
 *       500:
 *         description: Lỗi server.
 */
router.put("/:id", async (req, res) => {
  try {
    const { routineName, steps } = req.body;
    const updatedData = {};
    if (routineName) updatedData.routineName = routineName;
    if (steps) updatedData.steps = steps;

    const updatedRoutine = await Routine.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!updatedRoutine) return res.status(404).json({ message: "Routine không tồn tại" });
    res.status(200).json(updatedRoutine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/routine/{id}:
 *   delete:
 *     summary: Xóa một routine theo ID
 *     tags: [Routine]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của routine cần xóa
 *     responses:
 *       200:
 *         description: Routine được xóa thành công.
 *       404:
 *         description: Routine không tồn tại.
 *       500:
 *         description: Lỗi server.
 */
router.delete("/:id", async (req, res) => {
  try {
    const deletedRoutine = await Routine.findByIdAndDelete(req.params.id);
    if (!deletedRoutine) return res.status(404).json({ message: "Routine không tồn tại" });
    res.status(200).json({ message: "Routine đã được xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/routine/skin/{skinId}:
 *   get:
 *     summary: Lấy danh sách routine theo Skin ID
 *     tags: [Routine]
 *     parameters:
 *       - in: path
 *         name: skinId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của skin để lọc routine
 *     responses:
 *       200:
 *         description: Danh sách routine cho skin được trả về thành công.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Routine'
 *       500:
 *         description: Lỗi server.
 */
router.get("/skin/:skinId", async (req, res) => {
  try {
    const routines = await Routine.find({ skin: req.params.skinId });
    res.status(200).json(routines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
