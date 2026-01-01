const Labour = require('../models/Labour');
const LabourAttendance = require('../models/LabourAttendance');

// --------------------------------------------------
// GET DAILY ATTENDANCE (Smart Merge)
// --------------------------------------------------
exports.getDailyAttendance = async (req, res) => {
  try {
    const { date } = req.params;

    // 1️⃣ Get ALL Active Labourers (Daily, Monthly, Production, etc.)
    // We removed "category: daily" so everyone appears in the list.
    const labours = await Labour.find({ isActive: true }).sort({ name: 1 });

    // 2️⃣ Get Existing Attendance for this Date
    const records = await LabourAttendance.find({ date });

    // Create a map for quick lookup: { "labourId": "A", ... }
    const attendanceMap = {};
    records.forEach((r) => {
      attendanceMap[r.labourId.toString()] = r.status;
    });

    // 3️⃣ Merge Data
    const result = labours.map((l) => ({
      labourId: l._id,
      name: l.name,
      workType: l.workType, // Needed for Grouping in UI
      mobile: l.mobile,
      // If record exists, use that status. Otherwise default to 'P' (Present)
      status: attendanceMap[l._id.toString()] ?? 'P',
    }));

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------------------------------------------------
// SAVE ATTENDANCE
// --------------------------------------------------
exports.saveAttendance = async (req, res) => {
  try {
    const { date } = req.params;
    const { entries } = req.body; // Expects: [{ labourId: "...", status: "P" }]

    if (!date || !entries || !Array.isArray(entries)) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    // Loop through entries and update/insert
    const bulkOps = entries.map((e) => ({
      updateOne: {
        filter: { labourId: e.labourId, date: date },
        update: { $set: { status: e.status } },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await LabourAttendance.bulkWrite(bulkOps);
    }

    res.json({ message: 'Attendance saved successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};