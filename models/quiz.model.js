const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema(
  {
    option: {
      type: String,
      enum: ["a", "b", "c", "d"],
      required: true,
      description: "Mã đáp án (a, b, c, d)",
    },
    text: {
      type: String,
      required: true,
      description: "Nội dung đáp án",
    },
    point: {
      type: Number,
      required: true,
      description: "Điểm của đáp án này",
    },
  },
  { _id: false }
);

const QuizQuestionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
      description: "Nội dung câu hỏi",
    },
    answers: {
      type: [AnswerSchema],
      required: true,
      validate: {
        validator: function (v) {
          return v.length === 4;
        },
        message: "Mỗi câu hỏi phải có đúng 4 đáp án.",
      },
      description: "Mảng gồm 4 đáp án cho câu hỏi.",
    },
  },
  { timestamps: true }
);

const QuizQuestion = mongoose.model("QuizQuestion", QuizQuestionSchema);

module.exports = QuizQuestion;
