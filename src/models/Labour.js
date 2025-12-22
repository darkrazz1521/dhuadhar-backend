const mongoose = require('mongoose');

const labourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: [
        'daily',
        'moulder',
        'loader',
        'munshi',
        'driver',
        'cook',
      ],
      required: true,
    },

    // 🔥 NEW FIELD
    monthlySalary: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Labour', labourSchema);
