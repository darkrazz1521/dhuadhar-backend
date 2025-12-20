const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  category: String,
  rate: Number,
  quantity: Number,
  total: Number,
  paid: Number,
  due: Number,
  date: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
