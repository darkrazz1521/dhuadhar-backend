const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    unique: true,
  },
  rate: {
    type: Number,
    required: true,
  },
  updatedBy: {
    type: String, // owner username
  },
}, { timestamps: true });

module.exports = mongoose.model('Price', priceSchema);
