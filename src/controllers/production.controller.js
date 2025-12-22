const Labour = require('../models/Labour');
const ProductionEntry = require('../models/ProductionEntry');

// GET production list
exports.getProduction = async (req, res) => {
  try {
    const { type, date } = req.query;

    const labours = await Labour.find({
      type,
      isActive: true,
    });

    const records = await ProductionEntry.find({
      type,
      date,
    });

    const map = {};
    records.forEach(r => {
      map[r.labourId.toString()] = r;
    });

    const result = labours.map(l => {
      const r = map[l._id] || {};
      return {
        labourId: l._id,
        name: l.name,
        quantity: r.quantity || 0,
        ratePerThousand: r.ratePerThousand || 0,
        totalAmount: r.totalAmount || 0,
        paid: r.paid || false,
      };
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// SAVE production
exports.saveProduction = async (req, res) => {
  try {
    const { type, date, entries } = req.body;

    for (const e of entries) {
      const total =
        (e.quantity / 1000) * e.ratePerThousand;

      await ProductionEntry.findOneAndUpdate(
        {
          labourId: e.labourId,
          date,
        },
        {
          type,
          quantity: e.quantity,
          ratePerThousand: e.ratePerThousand,
          totalAmount: total,
        },
        { upsert: true }
      );
    }

    res.json({ message: 'Production saved' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// MARK PAID
exports.markPaid = async (req, res) => {
  try {
    const entry = await ProductionEntry.findById(
      req.params.id
    );
    entry.paid = true;
    await entry.save();
    res.json(entry);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};
