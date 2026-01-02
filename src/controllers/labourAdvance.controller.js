const LabourAdvance = require('../models/LabourAdvance');
const Labour = require('../models/Labour');

// --------------------------------------------------
// ADD ADVANCE (Kharcha)
// --------------------------------------------------
exports.addAdvance = async (req, res) => {
  try {
    const { labourId, date, amount, reason } = req.body;

    if (!labourId || !date || !amount) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const advance = await LabourAdvance.create({
      labourId,
      date,
      amount,
      reason,
      isRecovered: false, // Default is unpaid
    });

    res.status(201).json({ message: 'Advance added', advance });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------------------------------------------------
// GET ADVANCES
// --------------------------------------------------
exports.getAdvances = async (req, res) => {
  try {
    const { labourId } = req.query;
    
    const filter = {};
    if (labourId) filter.labourId = labourId;

    // Fetch advances sorted by newest date first
    // Populate labour name for easier display
    const data = await LabourAdvance.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .populate('labourId', 'name workType');

    res.json(data);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --------------------------------------------------
// DELETE ADVANCE (Tamper-Proof)
// --------------------------------------------------
exports.deleteAdvance = async (req, res) => {
  try {
    const { id } = req.params;
    const advance = await LabourAdvance.findById(id);

    if (!advance) {
      return res.status(404).json({ message: 'Not found' });
    }

    // 🔒 SECURITY CHECK
    // If this money was already deducted from a salary, you CANNOT delete it.
    if (advance.isRecovered) {
      return res.status(403).json({ 
        message: 'Cannot delete. This advance has already been settled in a salary payment.' 
      });
    }

    await advance.deleteOne();
    res.json({ message: 'Advance deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};