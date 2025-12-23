const mongoose = require('mongoose');

const labourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true, // ✅ TC-LAB-01
    },

    // DAILY / SALARY / PRODUCTION
    category: {
      type: String,
      enum: ['daily', 'salary', 'production'],
      required: true,
    },

    // Moulder / Loader / General / Driver / Cook / Munshi
    workType: {
      type: String,
      required: true,
    },

    // Payment fields (only one used depending on category)
    dailyRate: {
      type: Number,
      default: 0,
    },

    monthlySalary: {
      type: Number,
      default: 0,
    },

    productionRate: {
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
