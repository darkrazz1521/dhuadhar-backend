const mongoose = require('mongoose');

const advanceSchema = new mongoose.Schema(
  {
    // ✅ CUSTOMER RELATION (ID-BASED)
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    rate: {
      type: Number,
      required: true,
    },

    // 🔢 Total ordered quantity
    quantity: {
      type: Number,
      required: true,
    },

    // 🧱 Remaining quantity to deliver
    remainingQuantity: {
      type: Number,
      required: true,
    },

    // 🚚 Delivered quantity so far
    deliveredQuantity: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
    },

    // 💰 Advance paid
    advance: {
      type: Number,
      required: true,
    },

    // 💸 Remaining amount
    remaining: {
      type: Number,
      required: true,
    },

    // 📦 Delivery status
    status: {
      type: String,
      enum: ['pending', 'partial', 'delivered'],
      default: 'pending',
    },
    sales: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
  }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Advance', advanceSchema);
