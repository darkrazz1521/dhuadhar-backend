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

    // ───────────── LOCATION DETAILS (NEW) ─────────────
    area: {
      type: String,
      default: '', // Village / Area
    },

    city: {
      type: String,
      default: '', // City / Tehsil
    },

    address: {
      type: String,
      default: '', // Full Address
    },

    // ───────────── CATEGORY & WORK ─────────────
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

    // ───────────── PAYMENT ─────────────
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