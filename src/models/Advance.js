const mongoose = require('mongoose');

const advanceSchema = new mongoose.Schema(
  {
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

    advance: {
      type: Number,
      required: true,
    },

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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Advance', advanceSchema);
