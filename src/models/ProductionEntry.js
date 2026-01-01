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
    // Useful to separate Moulder vs Loader data
    type: {
      type: String,
      enum: ['moulder', 'loader', 'production'], 
      default: 'production',
    },
    // 🧱 Renamed to match Frontend
    brickCount: {
      type: Number,
      default: 0,
    },
    // 💰 Renamed to match Frontend
    wage: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Ensure one record per worker per day per type
productionEntrySchema.index(
  { labourId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model('ProductionEntry', productionEntrySchema);