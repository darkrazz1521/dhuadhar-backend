const mongoose = require('mongoose');

const labourPaymentSchema = new mongoose.Schema(
  {
    labourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Labour',
      required: true,
    },
    month: {
      type: String, // YYYY-MM
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paidDate: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  'LabourPayment',
  labourPaymentSchema
);
