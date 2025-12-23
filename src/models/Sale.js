const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
  {
    // ✅ NEW – PRIMARY RELATION (future-safe)
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },

    // ⚠️ TEMP – KEEP FOR BACKWARD COMPATIBILITY
    customerName: {
      type: String,
      default: '',
    },

    category: {
      type: String,
      required: true,
    },

    rate: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    total: {
      type: Number,
      required: true,
    },

    paid: {
      type: Number,
      default: 0,
    },

    due: {
      type: Number,
      default: 0,
    },

    // Optional explicit date (UI / reports)
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sale', saleSchema);
