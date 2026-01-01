const Labour = require('../models/Labour');
const ProductionEntry = require('../models/ProductionEntry');

// --------------------------------------------------
// GET DAILY PRODUCTION
// --------------------------------------------------
exports.getDailyProduction = async (req, res) => {
  try {
    const { date } = req.params;

    /**
     * Expected:
     * GET /production/daily/:date?workType=Modular|Kiln|Chamber|Loader
     */
    const { workType } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    // 1️⃣ Fetch ACTIVE production labourers (filtered by workType)
    const labourFilter = {
      isActive: true,
      category: 'production',
    };

    if (workType) {
      labourFilter.workType = workType;
    }

    const labours = await Labour.find(labourFilter).sort({ name: 1 });

    // 2️⃣ Fetch existing production records for this date + type
    const recordFilter = { date };
    if (workType) {
      recordFilter.type = workType;
    }

    const records = await ProductionEntry.find(recordFilter);

    // 3️⃣ Create lookup map (labourId → record)
    const productionMap = {};
    records.forEach((r) => {
      productionMap[r.labourId.toString()] = r;
    });

    // 4️⃣ Merge labour + production data
    const result = labours.map((l) => {
      const record = productionMap[l._id.toString()];

      const rate =
        l.ratePer1000Bricks ??
        l.productionRate ??
        0;

      return {
        labourId: l._id,
        name: l.name,
        workType: l.workType,

        rate, // frontend calculation

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
    const { workType } = req.query;

    if (!date || !Array.isArray(entries)) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    const type = workType || 'production';

    const bulkOps = entries.map((e) => ({
      updateOne: {
        filter: {
          labourId: e.labourId,
          date,
          type, // 🔐 CRITICAL
        },
        update: {
          $set: {
            brickCount: e.brickCount,
            wage: e.wage,
            type,
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
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
