const Labour = require('../models/Labour');
const ProductionEntry = require('../models/ProductionEntry');

// --------------------------------------------------
// GET DAILY PRODUCTION
// --------------------------------------------------
exports.getDailyProduction = async (req, res) => {
  try {
    const { date } = req.params;

    /**
     * Expected query params:
     * ?workType=Modular | Kiln | Chamber | Loader
     *
     * NOTE:
     * - All production workers have category = 'production'
     * - workType differentiates Modular / Kiln / Chamber
     */
    const { workType } = req.query;

    // 1️⃣ Fetch ACTIVE production labourers (filtered by workType)
    const labourFilter = {
      isActive: true,
      category: 'production',
    };

    if (workType) {
      labourFilter.workType = workType;
    }

    const labours = await Labour.find(labourFilter).sort({ name: 1 });

    // 2️⃣ Fetch existing production records for this date
    const records = await ProductionEntry.find({ date });

    // 3️⃣ Create lookup map for fast access
    const productionMap = {};
    records.forEach((r) => {
      productionMap[r.labourId.toString()] = r;
    });

    // 4️⃣ Merge labour + production data
    const result = labours.map((l) => {
      const record = productionMap[l._id.toString()];

      // Rate per 1000 bricks (priority order)
      const rate =
        l.ratePer1000Bricks ??
        l.productionRate ??
        0;

      return {
        labourId: l._id,
        name: l.name,
        workType: l.workType,

        rate, // required by frontend for live calculation

        // Existing data (if already saved)
        brickCount: record ? record.brickCount : 0,
        wage: record ? record.wage : 0,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('GET DAILY PRODUCTION ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------------------------------------------------
// SAVE PRODUCTION
// --------------------------------------------------
exports.saveProduction = async (req, res) => {
  try {
    const { date } = req.params;
    const { entries } = req.body;
    const { workType } = req.query; // Optional, but useful

    if (!date || !Array.isArray(entries)) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    // Prepare bulk operations
    const bulkOps = entries.map((e) => ({
      updateOne: {
        filter: {
          labourId: e.labourId,
          date,
        },
        update: {
          $set: {
            brickCount: e.brickCount,
            wage: e.wage,
            type: workType || 'production', // moulder / kiln / chamber
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length) {
      await ProductionEntry.bulkWrite(bulkOps);
    }

    res.json({ message: 'Production saved successfully' });
  } catch (error) {
    console.error('SAVE PRODUCTION ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------------------------------------------------
// MARK PAID (OPTIONAL)
// --------------------------------------------------
exports.markPaid = async (req, res) => {
  try {
    const entry = await ProductionEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    entry.paid = true;
    await entry.save();

    res.json(entry);
  } catch (error) {
    console.error('MARK PAID ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
