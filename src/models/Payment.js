const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    labourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Labour',
      required: true,
    },
    paymentDate: { type: String, required: true }, // Date money was given
    
    // Period Paid For (e.g. 2025-10-01 to 2025-10-31)
    fromDate: { type: String, required: true },
    toDate: { type: String, required: true },

    // 📸 SNAPSHOTS (Data locked at time of payment)
    totalDaysPresent: { type: Number, default: 0 }, // For Daily/Salary
    totalProduction: { type: Number, default: 0 },  // For Moulder/Kiln
    
    // 💰 FINANCIALS
    grossAmount: { type: Number, required: true }, // Total Earnings
    advanceDeducted: { type: Number, default: 0 }, // Kharcha Cut
    netPaid: { type: Number, required: true },     // Final Cash Given
    
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);