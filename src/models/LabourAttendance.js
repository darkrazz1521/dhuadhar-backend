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
    // 🟢 🟠 🔴 New Status Field
    status: {
      type: String,
      enum: ['P', 'H', 'A'], // Present, Half-Day, Absent
      default: 'P',
    },
  },
  { timestamps: true }
);

// Ensure one record per labour per day
labourAttendanceSchema.index(
  { labourId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  'LabourAttendance',
  labourAttendanceSchema
);