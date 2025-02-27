const express = require("express");
const QuizQuestion = require("../models/quiz.model");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: QuizQuestion
 *   description: API cho quản lý các câu hỏi quiz (mỗi câu có 4 đáp án)
 */

/**
 * @swagger
 * /api/quiz:
 *   get:
 *     summary: Lấy danh sách tất cả các câu hỏi quiz
 *     tags: [QuizQuestion]
 *     responses:
 *       200:
 *         description: Danh sách các câu hỏi quiz
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/QuizQuestion'
 *       500:
 *         description: Lỗi server.
 */
router.get("/", async (req, res) => {
  try {
    const questions = await QuizQuestion.find();
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/quiz:
 *   post:
 *     summary: Tạo một câu hỏi quiz mới
 *     tags: [QuizQuestion]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               questionText:
 *                 type: string
 *                 description: Nội dung câu hỏi
 *                 example: "Da của bạn có thường xuyên bị bóng nhờn không?"
 *               answers:
 *                 type: array
 *                 description: Mảng gồm 4 đáp án
 *                 items:
 *                   type: object
 *                   properties:
 *                     option:
 *                       type: string
 *                       description: Mã đáp án (a, b, c, d)
 *                       example: "a"
 *                     text:
 *                       type: string
 *                       description: Nội dung đáp án
 *                       example: "Có"
 *                     point:
 *                       type: number
 *                       description: Điểm của đáp án này
 *                       example: 1
 *     responses:
 *       201:
 *         description: Câu hỏi quiz được tạo thành công.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuizQuestion'
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ.
 *       500:
 *         description: Lỗi server.
 */
router.post("/", async (req, res) => {
  try {
    const { questionText, answers } = req.body;
    if (!questionText || !answers || !Array.isArray(answers) || answers.length !== 4) {
      return res.status(400).json({ message: "Cần có questionText và đúng 4 đáp án." });
    }
    const newQuestion = new QuizQuestion({ questionText, answers });
    const savedQuestion = await newQuestion.save();
    res.status(201).json(savedQuestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/quiz/{id}:
 *   put:
 *     summary: Cập nhật một câu hỏi quiz theo ID
 *     tags: [QuizQuestion]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của câu hỏi cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               questionText:
 *                 type: string
 *                 description: Nội dung câu hỏi
 *                 example: "Cập nhật câu hỏi"
 *               answers:
 *                 type: array
 *                 description: Mảng gồm 4 đáp án
 *                 items:
 *                   type: object
 *                   properties:
 *                     option:
 *                       type: string
 *                       description: Mã đáp án (a, b, c, d)
 *                       example: "b"
 *                     text:
 *                       type: string
 *                       description: Nội dung đáp án
 *                       example: "Không"
 *                     point:
 *                       type: number
 *                       description: Điểm của đáp án này
 *                       example: 2
 *     responses:
 *       200:
 *         description: Câu hỏi quiz được cập nhật thành công.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuizQuestion'
 *       404:
 *         description: Câu hỏi không tồn tại.
 *       500:
 *         description: Lỗi server.
 */
router.put("/:id", async (req, res) => {
  try {
    const { questionText, answers } = req.body;
    const updatedData = {};
    if (questionText) updatedData.questionText = questionText;
    if (answers) {
      if (!Array.isArray(answers) || answers.length !== 4) {
        return res.status(400).json({ message: "Cần cung cấp đúng 4 đáp án." });
      }
      updatedData.answers = answers;
    }

    const updatedQuestion = await QuizQuestion.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!updatedQuestion) return res.status(404).json({ message: "Câu hỏi không tồn tại." });
    res.status(200).json(updatedQuestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/quiz/{id}:
 *   delete:
 *     summary: Xóa một câu hỏi quiz theo ID
 *     tags: [QuizQuestion]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của câu hỏi cần xóa
 *     responses:
 *       200:
 *         description: Câu hỏi quiz đã được xóa thành công.
 *       404:
 *         description: Câu hỏi không tồn tại.
 *       500:
 *         description: Lỗi server.
 */
router.delete("/:id", async (req, res) => {
  try {
    const deletedQuestion = await QuizQuestion.findByIdAndDelete(req.params.id);
    if (!deletedQuestion) return res.status(404).json({ message: "Câu hỏi không tồn tại." });
    res.status(200).json({ message: "Câu hỏi đã được xóa thành công." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/quiz/submit:
 *   post:
 *     summary: Gửi câu trả lời cho các câu hỏi quiz, tính tổng điểm và đưa ra gợi ý loại da
 *     tags: [QuizQuestion]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: array
 *                 description: Mảng các câu trả lời, mỗi phần tử gồm id câu hỏi và đáp án được chọn
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                       description: ID của câu hỏi
 *                       example: "64f8a6d123abc4567e891011"
 *                     selectedOption:
 *                       type: string
 *                       description: Đáp án được chọn (a, b, c hoặc d)
 *                       example: "a"
 *     responses:
 *       200:
 *         description: Tổng điểm và gợi ý loại da.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalScore:
 *                   type: number
 *                   description: Tổng điểm đạt được
 *                   example: 8
 *                 suggestion:
 *                   type: string
 *                   description: Gợi ý loại da dựa trên tổng điểm
 *                   example: "Combination Skin"
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ.
 *       500:
 *         description: Lỗi server.
 */
router.post("/submit", async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Mảng answers là bắt buộc." });
    }

    let totalScore = 0;

    // Duyệt qua từng câu trả lời từ client
    for (const item of answers) {
      const { questionId, selectedOption } = item;
      const question = await QuizQuestion.findById(questionId);
      if (question) {
        const answer = question.answers.find((ans) => ans.option === selectedOption);
        if (answer) {
          totalScore += answer.point;
        }
      }
    }

    // Ví dụ logic gợi ý loại da dựa trên tổng điểm
    let suggestion = "";
    if (totalScore <= 3) {
      suggestion = "Dry skin";
    } else if (totalScore > 3 && totalScore <= 5) {
      suggestion = "Normal skin";
    } else if (totalScore > 5 && totalScore <= 7) {
      suggestion = "Sensitive skin";
    } else if (totalScore > 7 && totalScore <= 9) {
      suggestion = "Oil skin";
    } else {
      suggestion = "Aging skin";
    }

    res.status(200).json({ totalScore, suggestion });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
