const Labour = require('../models/Labour');
const LabourAttendance = require('../models/LabourAttendance');

// GET daily attendance list
exports.getDailyAttendance = async (req, res) => {
  try {
    const { date } = req.params;

    // 1️⃣ Active DAILY labour
    const labours = await Labour.find({
  category: 'daily',
  isActive: true,
});


    // 2️⃣ Existing attendance
    const records = await LabourAttendance.find({ date });

    const map = {};
    records.forEach(r => {
      map[r.labourId.toString()] = r;
    });

    // 3️⃣ Merge
    const result = labours.map(l => ({
      labourId: l._id,
      name: l.name,
      present: map[l._id.toString()]?.present ?? false,
      wage: map[l._id.toString()]?.wage ?? 0,
    }));

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// SAVE attendance
exports.saveAttendance = async (req, res) => {
  try {
    const { date } = req.params;
    const { entries } = req.body;

    if (!date || !entries) {
      return res.status(400).json({ message: 'Missing data' });
    }

    for (const e of entries) {
      await LabourAttendance.findOneAndUpdate(
        { labourId: e.labourId, date },
        {
          present: e.present,
          wage: e.present ? e.wage : 0,
        },
        { upsert: true, new: true }
      );
    }

    res.json({ message: 'Attendance saved' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};
