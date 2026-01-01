const Labour = require('../models/Labour');
const ProductionEntry = require('../models/ProductionEntry');

// --------------------------------------------------
// GET DAILY PRODUCTION
// --------------------------------------------------
exports.getDailyProduction = async (req, res) => {
  try {
    const { date } = req.params;
    // Frontend sends ?category=production (or 'moulder', 'loader')
    const category = req.query.category || 'production'; 

    // 1️⃣ Get Active Labourers for this category
    // We map frontend 'production' category to database 'workType' or 'category'
    // If you have specific workTypes like 'Moulder', active filter handles it.
    const labours = await Labour.find({
      isActive: true,
      // If you want to be specific: category: 'production'
    }).sort({ name: 1 });

    // 2️⃣ Get Existing Production Data for this Date
    const records = await ProductionEntry.find({ date });

    // Create a map for quick lookup
    const productionMap = {};
    records.forEach((r) => {
      productionMap[r.labourId.toString()] = r;
    });

    // 3️⃣ Merge Data
    const result = labours.map((l) => {
      const record = productionMap[l._id.toString()];

      // Determine the rate to send to frontend
      // Prioritize specific rate per 1000 bricks, else fallback to generic productionRate
      const currentRate = l.ratePer1000Bricks || l.productionRate || 0;

      return {
        labourId: l._id,
        name: l.name,
        workType: l.workType,
        rate: currentRate, // ⚡ Important: Frontend needs this for live calculation

        // Existing Data (if any)
        brickCount: record ? record.brickCount : 0,
        wage: record ? record.wage : 0,
      };
    });

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------------------------------------------------
// SAVE PRODUCTION
// --------------------------------------------------
exports.saveProduction = async (req, res) => {
  try {
    const { date } = req.params;
    const { entries } = req.body; // [{ labourId, brickCount, wage }]

    if (!date || !entries || !Array.isArray(entries)) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    // Prepare Bulk Operations
    // We explicitly set type: 'production' (or based on logic) to keep data clean
    const bulkOps = entries.map((e) => ({
      updateOne: {
        filter: { labourId: e.labourId, date: date },
        update: {
          $set: {
            brickCount: e.brickCount,
            wage: e.wage,
            type: 'production', // Standardize type
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await ProductionEntry.bulkWrite(bulkOps);
    }

    res.json({ message: 'Production saved successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------------------------------------------------
// MARK PAID (Optional - Keep if you use it)
// --------------------------------------------------
exports.markPaid = async (req, res) => {
  try {
    const entry = await ProductionEntry.findById(req.params.id);
    if (entry) {
      entry.paid = true;
      await entry.save();
    }
    res.json(entry);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};