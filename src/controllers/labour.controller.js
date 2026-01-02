const Labour = require('../models/Labour');
const LabourAttendance = require('../models/LabourAttendance'); // ✅ New
const ProductionEntry = require('../models/ProductionEntry');   // ✅ New
const LabourAdvance = require('../models/LabourAdvance');       // ✅ New
const Payment = require('../models/Payment');                   // ✅ New

// --------------------------------------------------
// GET LABOUR MASTER
// --------------------------------------------------
exports.getLabours = async (req, res) => {
  try {
    const data = await Labour.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --------------------------------------------------
// CREATE LABOUR (TC-LAB-01)
// --------------------------------------------------
exports.createLabour = async (req, res) => {
  try {
    const {
      name,
      mobile,
      category,
      workType,
      dailyRate,
      monthlySalary,
      productionRate,
      ratePer1000Bricks, // Handle alias from Flutter
      area,
      city,
      address,
    } = req.body;

    if (!name || !mobile || !category || !workType) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // ❌ Duplicate labour
    const exists = await Labour.findOne({ mobile });
    if (exists) {
      return res
        .status(400)
        .json({ message: 'Labour already exists' });
    }

    const labour = {
      name,
      mobile,
      category,
      workType,
      // Save location fields (Default to empty string if missing)
      area: area || '',
      city: city || '',
      address: address || '',
    };

    // ───────────── Payment Validation ─────────────

    // 1. DAILY
    if (category === 'daily') {
      if (!dailyRate)
        return res
          .status(400)
          .json({ message: 'Daily rate required' });

      labour.dailyRate = dailyRate;
    }

    // 2. SALARY
    if (category === 'salary') {
      if (!monthlySalary)
        return res
          .status(400)
          .json({ message: 'Monthly salary required' });

      labour.monthlySalary = monthlySalary;
    }

    // 3. PRODUCTION (Kiln, Chamber, Modular)
    if (category === 'production') {
      // Check both keys: 'productionRate' OR 'ratePer1000Bricks'
      const rate = productionRate || ratePer1000Bricks;

      if (!rate)
        return res
          .status(400)
          .json({ message: 'Production rate required' });

      labour.productionRate = rate;
    }

    const saved = await Labour.create(labour);
    res.status(201).json(saved);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------------------------------------------------
// TOGGLE ACTIVE / INACTIVE
// --------------------------------------------------
exports.toggleLabourStatus = async (req, res) => {
  try {
    const labour = await Labour.findById(req.params.id);
    if (!labour) {
      return res.status(404).json({ message: 'Not found' });
    }

    labour.isActive = !labour.isActive;
    await labour.save();

    res.json(labour);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --------------------------------------------------
// GET ACTIVE DRIVERS ONLY
// --------------------------------------------------
exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Labour.find({
      workType: 'Driver',
      isActive: true,
    }).sort({ name: 1 });

    res.json(drivers);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------------------------------------------------
// 📊 GET FULL LABOUR PROFILE (Master View)
// --------------------------------------------------
exports.getLabourProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Basic Details
    const labour = await Labour.findById(id);
    if (!labour) return res.status(404).json({ message: 'Labour not found' });

    // 2️⃣ Lifetime Attendance Stats (for Daily/Salary workers)
    // We count total Present (P) and Half Days (H)
    const attendanceStats = await LabourAttendance.aggregate([
      { $match: { labourId: labour._id } },
      {
        $group: {
          _id: null,
          totalPresent: { 
            $sum: { $cond: [{ $eq: ["$status", "P"] }, 1, 0] } 
          },
          totalHalf: { 
            $sum: { $cond: [{ $eq: ["$status", "H"] }, 1, 0] } 
          },
          lastPresent: { $max: "$date" } // Last day they came
        }
      }
    ]);

    const att = attendanceStats[0] || { totalPresent: 0, totalHalf: 0, lastPresent: null };
    // Calculate "Effective Days" (P + 0.5*H)
    const effectiveDays = att.totalPresent + (att.totalHalf * 0.5);

    // 3️⃣ Lifetime Production Stats (for Moulder/Loader/Kiln)
    const productionStats = await ProductionEntry.aggregate([
      { $match: { labourId: labour._id } },
      {
        $group: {
          _id: null,
          totalBricks: { $sum: "$brickCount" }, // Total Output
          totalWageEarned: { $sum: "$wage" },   // Total Earnings from Production
          lastProductionDate: { $max: "$date" }
        }
      }
    ]);

    const prod = productionStats[0] || { totalBricks: 0, totalWageEarned: 0, lastProductionDate: null };

    // 4️⃣ Financial Status
    // A. Current Debt (Unrecovered Advances)
    const pendingAdvances = await LabourAdvance.aggregate([
      { $match: { labourId: labour._id, isRecovered: false } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const currentDebt = pendingAdvances[0]?.total || 0;

    // B. Payment History (Last 5 Payments)
    const lastPayments = await Payment.find({ labourId: labour._id })
      .sort({ paymentDate: -1 })
      .limit(5)
      .select('paymentDate fromDate toDate netPaid grossAmount');

    // C. Total Lifetime Payout
    const totalPaidStats = await Payment.aggregate([
      { $match: { labourId: labour._id } },
      { $group: { _id: null, total: { $sum: "$netPaid" } } }
    ]);
    const lifetimePaid = totalPaidStats[0]?.total || 0;

    // 5️⃣ Construct Final Response
    res.json({
      details: {
        name: labour.name,
        mobile: labour.mobile,
        category: labour.category,
        workType: labour.workType,
        rate: labour.ratePer1000Bricks || labour.dailyRate || labour.monthlySalary || 0,
        status: labour.isActive ? 'Active' : 'Inactive',
        location: `${labour.area}, ${labour.city}`,
        joinedAt: labour.createdAt,
      },
      performance: {
        totalDaysPresent: effectiveDays, // For Daily/Salary
        totalProduction: prod.totalBricks, // For Production
        totalProductionEarnings: prod.totalWageEarned,
        lastActiveDate: att.lastPresent || prod.lastProductionDate || 'N/A',
      },
      finance: {
        currentAdvanceBalance: currentDebt, // Money they owe you currently
        lifetimeEarningsPaid: lifetimePaid, // Total money you gave them
        lastPayments,
      }
    });

  } catch (e) {
    console.error('PROFILE ERROR:', e);
    res.status(500).json({ message: 'Server error' });
  }
};