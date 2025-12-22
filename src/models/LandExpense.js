const mongoose = require('mongoose');

const landExpenseSchema = new mongoose.Schema(
  {
    landType: {
      type: String,
      enum: ['owned', 'rented'],
      required: true,
    },
    month: {
      type: String, // YYYY-MM
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
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

module.exports = mongoose.model('LandExpense', landExpenseSchema);
