const mongoose = require('mongoose');

const dieselExpenseSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    litres: {
      type: Number,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DieselExpense', dieselExpenseSchema);
