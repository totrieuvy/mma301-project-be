const mongoose = require("mongoose");

const RoutineStepSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      required: true,
      description: "Thứ tự của bước trong routine",
    },
    description: {
      type: String,
      required: true,
      description: "Mô tả chi tiết của bước",
    },
  },
  { _id: false } // Không cần _id riêng cho mỗi bước
);

const RoutineSchema = new mongoose.Schema(
  {
    skin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skin",
      required: true,
    },
    routineName: {
      type: String,
      required: true,
      description: "Tên của routine",
    },
    steps: {
      type: [RoutineStepSchema],
      required: true,
      description: "Danh sách các bước trong routine",
    },
  },
  { timestamps: true }
);

const Routine = mongoose.model("Routine", RoutineSchema);

module.exports = Routine;
