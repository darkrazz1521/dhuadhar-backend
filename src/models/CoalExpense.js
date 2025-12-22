const mongoose = require('mongoose');

const coalExpenseSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    supplier: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number, // in tons
      required: true,
    },
    rate: {
      type: Number, // per ton
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

module.exports = mongoose.model('CoalExpense', coalExpenseSchema);
