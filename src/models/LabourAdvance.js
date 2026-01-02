const mongoose = require('mongoose');

const labourAdvanceSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String, // e.g. "Food", "Emergency"
      default: '',
    },
    // 🔒 Security: If TRUE, this money was cut from a salary. Cannot delete.
    isRecovered: {
      type: Boolean,
      default: false,
    },
    // Which payment record settled this advance
    settledInPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LabourAdvance', labourAdvanceSchema);