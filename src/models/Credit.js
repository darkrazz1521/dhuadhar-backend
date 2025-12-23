const mongoose = require('mongoose');

const creditSchema = new mongoose.Schema(
  {
    // ✅ CUSTOMER RELATION (ID-BASED)
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      unique: true, // one credit ledger per customer
    },

    totalDue: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Credit', creditSchema);
