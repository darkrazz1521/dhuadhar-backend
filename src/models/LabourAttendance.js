const mongoose = require('mongoose');

const labourAttendanceSchema = new mongoose.Schema(
  {
    labourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Labour',
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    present: {
      type: Boolean,
      default: true,
    },
    wage: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

labourAttendanceSchema.index(
  { labourId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  'LabourAttendance',
  labourAttendanceSchema
);
