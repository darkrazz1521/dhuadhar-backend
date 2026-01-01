const mongoose = require('mongoose');

const productionEntrySchema = new mongoose.Schema(
  {
    labourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Labour',
      required: true,
    },

    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },

    /**
     * Production type
     * Matches Labour.workType (e.g. 'Loader', 'Modular')
     */
    type: {
      type: String,
      required: true, 
      // enum: ['Modular', 'Kiln', 'Chamber', 'Loader'], // Optional validation
    },

    // 🧱 Total bricks produced (or Trips for Loader)
    brickCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // 💰 Calculated wage
    wage: {
      type: Number,
      default: 0,
      min: 0,
    },

    // 💳 Payment status (future-proof)
    paid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/**
 * 🔐 CRITICAL UNIQUE INDEX
 * Ensures one record per worker per day per type
 */
productionEntrySchema.index(
  { labourId: 1, date: 1, type: 1 },
  { unique: true }
);

module.exports = mongoose.model('ProductionEntry', productionEntrySchema);