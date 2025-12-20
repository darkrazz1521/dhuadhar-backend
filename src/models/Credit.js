const mongoose = require('mongoose');

const creditSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    unique: true,
  },
  totalDue: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('Credit', creditSchema);
