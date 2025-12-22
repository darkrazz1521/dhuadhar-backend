const mongoose = require('mongoose');

const productionEntrySchema = new mongoose.Schema(
  {
    labourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Labour',
      required: true,
    },
    type: {
      type: String,
      enum: ['moulder', 'loader'],
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    quantity: {
      type: Number, // bricks count
      required: true,
    },
    ratePerThousand: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

productionEntrySchema.index(
  { labourId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  'ProductionEntry',
  productionEntrySchema
);
