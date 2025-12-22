const Labour = require('../models/Labour');
const LabourAttendance = require('../models/LabourAttendance');

// GET daily attendance list
exports.getDailyAttendance = async (req, res) => {
  try {
    const { date } = req.query;

    const labours = await Labour.find({
      type: 'daily',
      isActive: true,
    });

    const records = await LabourAttendance.find({ date });

    const map = {};
    records.forEach(r => {
      map[r.labourId.toString()] = r;
    });

    const result = labours.map(l => ({
      labourId: l._id,
      name: l.name,
      present: map[l._id]?.present ?? false,
      wage: map[l._id]?.wage ?? 0,
    }));

    res.json(result);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// SAVE attendance
exports.saveAttendance = async (req, res) => {
  try {
    const { date, entries } = req.body;

    if (!date || !entries) {
      return res.status(400).json({ message: 'Missing data' });
    }

    for (const e of entries) {
      await LabourAttendance.findOneAndUpdate(
        {
          labourId: e.labourId,
          date,
        },
        {
          present: e.present,
          wage: e.present ? e.wage : 0,
        },
        { upsert: true }
      );
    }

    res.json({ message: 'Attendance saved' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};
